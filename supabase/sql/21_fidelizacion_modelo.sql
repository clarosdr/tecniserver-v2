BEGIN;

DO $$
BEGIN

-- 1) TABLAS BASE
-- libro mayor de puntos (auditable)
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id bigserial PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  motivo text NOT NULL,                  -- ej: 'venta_pagada', 'ajuste', 'canje', 'bonus'
  referencia text,                       -- id de venta/nota/canje, etc
  puntos int NOT NULL,                   -- +acumulación, -descuento
  vence_at date NULL,                    -- vencimiento de esta porción de puntos
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pl_cliente ON public.points_ledger(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pl_vence   ON public.points_ledger(vence_at);
COMMENT ON TABLE public.points_ledger IS 'Libro mayor auditable de todos los movimientos de puntos de fidelidad.';

-- saldos consolidados por cliente
CREATE TABLE IF NOT EXISTS public.points_balance (
  cliente_id uuid PRIMARY KEY REFERENCES public.clientes(id) ON DELETE CASCADE,
  puntos int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.points_balance IS 'Saldos de puntos consolidados y vigentes por cliente para consultas rápidas.';

-- reglas de acumulación (por ahora simple: % del total pagado)
CREATE TABLE IF NOT EXISTS public.points_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activa boolean NOT NULL DEFAULT true,
  pct_acumulacion decimal(7,4) NOT NULL DEFAULT 1.0, -- pct sobre total (ej: 1.0 -> 1 punto por cada $1)
  min_ticket numeric(14,2) DEFAULT 0,                -- mínimo de compra elegible
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.points_rules IS 'Reglas de negocio para la acumulación de puntos en compras.';

-- cupones (emisión manual o por campaña)
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descripcion text,
  tipo text NOT NULL CHECK (tipo IN ('descuento_fijo','descuento_pct','bono_puntos')),
  valor numeric(14,4) NOT NULL,
  vigente boolean NOT NULL DEFAULT true,
  vence_at date NULL,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.coupons IS 'Cupones de descuento o bonificación de puntos.';

-- canjes (uso de puntos o cupones)
CREATE TABLE IF NOT EXISTS public.redemptions (
  id bigserial PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('puntos','cupon')),
  puntos_usados int DEFAULT 0,             -- si tipo='puntos'
  cupon_id uuid NULL REFERENCES public.coupons(id) ON DELETE SET NULL,
  referencia text,                         -- p.ej., id de venta/OT
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rd_cliente ON public.redemptions(cliente_id);
COMMENT ON TABLE public.redemptions IS 'Registro de canjes de puntos o uso de cupones por parte de los clientes.';

-- 2) FUNCIONES AUXILIARES
-- recalcular saldo del cliente (sumatoria del ledger)
CREATE OR REPLACE FUNCTION public.fn_points_recalc_balance(_cliente uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _saldo int;
BEGIN
  SELECT COALESCE(SUM(puntos),0) INTO _saldo
  FROM public.points_ledger
  WHERE cliente_id = _cliente
    AND (vence_at IS NULL OR vence_at >= current_date);
  INSERT INTO public.points_balance(cliente_id, puntos, updated_at)
  VALUES (_cliente, _saldo, now())
  ON CONFLICT (cliente_id)
  DO UPDATE SET puntos = EXCLUDED.puntos, updated_at = now();
END; $$;
COMMENT ON FUNCTION public.fn_points_recalc_balance(uuid) IS 'Calcula y actualiza el saldo de puntos de un cliente basándose en el libro mayor.';

-- acumular puntos (+) en ledger y actualizar balance
CREATE OR REPLACE FUNCTION public.fn_points_accrue(_cliente uuid, _puntos int, _motivo text, _ref text, _vence date DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.points_ledger(cliente_id, motivo, referencia, puntos, vence_at)
  VALUES (_cliente, _motivo, _ref, GREATEST(_puntos,0), _vence);
  PERFORM public.fn_points_recalc_balance(_cliente);
END; $$;
COMMENT ON FUNCTION public.fn_points_accrue(uuid, int, text, text, date) IS 'Añade puntos a un cliente, registrando el motivo y actualizando su saldo.';

-- descontar puntos (-) (verifica saldo suficiente)
CREATE OR REPLACE FUNCTION public.fn_points_spend(_cliente uuid, _puntos int, _motivo text, _ref text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _saldo int;
BEGIN
  SELECT puntos INTO _saldo FROM public.points_balance WHERE cliente_id=_cliente FOR UPDATE;
  IF _saldo IS NULL THEN _saldo := 0; END IF;
  IF _saldo < _puntos THEN
    RAISE EXCEPTION 'Saldo de puntos insuficiente';
  END IF;

  INSERT INTO public.points_ledger(cliente_id, motivo, referencia, puntos)
  VALUES (_cliente, _motivo, _ref, -GREATEST(_puntos,0));
  PERFORM public.fn_points_recalc_balance(_cliente);
END; $$;
COMMENT ON FUNCTION public.fn_points_spend(uuid, int, text, text) IS 'Resta puntos de un cliente, verificando saldo y actualizándolo.';

-- 3) HOOKS CON POS
-- al marcar una venta como 'pagada' → acumula puntos según regla activa
CREATE OR REPLACE FUNCTION public.fn_points_on_venta_pagada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _pct numeric(7,4); _min numeric(14,2); _puntos int;
BEGIN
  IF NEW.estado = 'pagada' AND OLD.estado IS DISTINCT FROM 'pagada' AND NEW.cliente_id IS NOT NULL THEN
    SELECT pct_acumulacion, COALESCE(min_ticket,0) INTO _pct, _min
    FROM public.points_rules WHERE activa = true
    ORDER BY created_at DESC LIMIT 1;

    IF FOUND AND COALESCE(NEW.total,0) >= COALESCE(_min,0) THEN
      _puntos := FLOOR(COALESCE(_pct,1.0) * COALESCE(NEW.total,0));
      IF _puntos > 0 THEN
        PERFORM public.fn_points_accrue(NEW.cliente_id, _puntos, 'venta_pagada', NEW.id::text, NULL);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_points_on_venta_pagada ON public.ventas;
CREATE TRIGGER trg_points_on_venta_pagada
AFTER UPDATE ON public.ventas
FOR EACH ROW EXECUTE FUNCTION public.fn_points_on_venta_pagada();
COMMENT ON TRIGGER trg_points_on_venta_pagada ON public.ventas IS 'Acumula puntos de fidelidad cuando una venta se marca como pagada.';

-- al crear nota de crédito → reversa proporcional (simple: reversa total)
CREATE OR REPLACE FUNCTION public.fn_points_on_nota_credito()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _cliente uuid; _tot numeric(14,2); _pct numeric(7,4); _puntos int;
BEGIN
  SELECT v.cliente_id, v.total INTO _cliente, _tot
  FROM public.ventas v WHERE v.id = NEW.venta_id;

  IF _cliente IS NOT NULL THEN
    SELECT pct_acumulacion INTO _pct
    FROM public.points_rules WHERE activa = true ORDER BY created_at DESC LIMIT 1;

    IF FOUND THEN
      _puntos := FLOOR(COALESCE(_pct,1.0) * COALESCE(_tot,0));
      IF _puntos > 0 THEN
        PERFORM public.fn_points_spend(_cliente, _puntos, 'reversa_por_nc', NEW.id::text);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_points_on_nc ON public.notas_credito;
CREATE TRIGGER trg_points_on_nc
AFTER INSERT ON public.notas_credito
FOR EACH ROW EXECUTE FUNCTION public.fn_points_on_nota_credito();
COMMENT ON TRIGGER trg_points_on_nc ON public.notas_credito IS 'Reversa los puntos acumulados en una venta cuando se crea una nota de crédito asociada.';

-- 4) CANJES
-- canje por puntos
CREATE OR REPLACE FUNCTION public.fn_points_redeem(_cliente uuid, _puntos int, _ref text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _id bigint;
BEGIN
  PERFORM public.fn_points_spend(_cliente, _puntos, 'canje', _ref);
  INSERT INTO public.redemptions(cliente_id, tipo, puntos_usados, referencia)
  VALUES (_cliente, 'puntos', _puntos, _ref)
  RETURNING id INTO _id;
  RETURN _id;
END; $$;
COMMENT ON FUNCTION public.fn_points_redeem(uuid, int, text) IS 'Registra un canje de puntos, descontando el saldo y creando un registro de redención.';

-- canje por cupón (no descuenta puntos, solo registra uso)
CREATE OR REPLACE FUNCTION public.fn_coupon_redeem(_cliente uuid, _codigo text, _ref text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _cid uuid; _vig boolean; _vence date; _red_id bigint;
BEGIN
  SELECT id, vigente, vence_at INTO _cid, _vig, _vence
  FROM public.coupons WHERE codigo=_codigo;

  IF _cid IS NULL OR _vig = false OR (_vence IS NOT NULL AND _vence < current_date) THEN
    RAISE EXCEPTION 'Cupón inválido o vencido';
  END IF;

  INSERT INTO public.redemptions(cliente_id, tipo, cupon_id, referencia)
  VALUES (_cliente, 'cupon', _cid, _ref)
  RETURNING id INTO _red_id;

  RETURN _red_id;
END; $$;
COMMENT ON FUNCTION public.fn_coupon_redeem(uuid, text, text) IS 'Valida y registra el uso de un cupón, creando un registro de redención.';

-- 5) VISTAS
CREATE OR REPLACE VIEW public.v_points_movimientos AS
SELECT l.id, l.cliente_id, c.nombre AS cliente, l.motivo, l.referencia, l.puntos, l.vence_at, l.created_at
FROM public.points_ledger l JOIN public.clientes c ON c.id=l.cliente_id
ORDER BY l.created_at DESC;
COMMENT ON VIEW public.v_points_movimientos IS 'Vista detallada de todos los movimientos de puntos por cliente.';

CREATE OR REPLACE VIEW public.v_points_resumen AS
SELECT b.cliente_id, c.nombre, b.puntos, b.updated_at
FROM public.points_balance b JOIN public.clientes c ON c.id=b.cliente_id;
COMMENT ON VIEW public.v_points_resumen IS 'Vista resumida de los saldos de puntos actuales de todos los clientes.';

-- 6) SEED opcional
INSERT INTO public.points_rules (activa, pct_acumulacion, min_ticket)
SELECT true, 1.0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.points_rules);

END $$;

COMMIT;

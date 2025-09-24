-- ==========[ Módulo Marketplace: Modelo de Datos ]==========
-- Script: 19_marketplace_modelo.sql
-- Descripción: Tablas y lógica para el catálogo público, pedidos, comisiones y liquidaciones.
---------------------------------------------------------------------------------

BEGIN;

DO $$
BEGIN

-- 1) PUBLICACIONES (catálogo público de socios)
CREATE TABLE IF NOT EXISTS public.mk_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
  producto_id uuid NULL REFERENCES public.productos(id) ON DELETE SET NULL, -- opcional: enlazar a inventario local
  sku text,
  nombre text NOT NULL,
  descripcion text,
  precio numeric(14,2) NOT NULL CHECK (precio>=0),
  iva_pct decimal(5,2) DEFAULT 0,
  stock_publicado int DEFAULT 0,
  activo boolean DEFAULT true,
  media jsonb,                               -- imágenes/urls
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.mk_products IS 'Catálogo de productos/servicios publicados por las empresas socias en el marketplace.';
COMMENT ON COLUMN public.mk_products.empresa_id IS 'Empresa socia que publica el producto.';
COMMENT ON COLUMN public.mk_products.producto_id IS 'Enlace opcional al ítem de inventario interno de la empresa.';

CREATE INDEX IF NOT EXISTS idx_mk_prod_empresa ON public.mk_products(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mk_prod_nombre ON public.mk_products(LOWER(nombre));

-- 2) PEDIDOS (ordenado por cliente final, cumplido por empresa socia)
CREATE TABLE IF NOT EXISTS public.mk_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,                         -- MK-YYYY-000001
  cliente_id uuid NULL REFERENCES public.clientes(id) ON DELETE SET NULL,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
  estado text NOT NULL DEFAULT 'creada' CHECK (estado IN ('creada','pagada','en_proceso','enviada','entregada','cancelada','devuelta')),
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  impuestos numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  origen text DEFAULT 'portal' CHECK (origen IN ('portal','admin','api')),
  created_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.mk_orders IS 'Pedidos realizados por clientes finales a las empresas socias a través del marketplace.';

CREATE INDEX IF NOT EXISTS idx_mko_estado ON public.mk_orders(estado);

CREATE TABLE IF NOT EXISTS public.mk_order_items (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.mk_orders(id) ON DELETE CASCADE,
  mk_product_id uuid NOT NULL REFERENCES public.mk_products(id) ON DELETE RESTRICT,
  cantidad int NOT NULL CHECK (cantidad>0),
  precio_unit numeric(14,2) NOT NULL CHECK (precio_unit>=0),
  iva_pct decimal(5,2) DEFAULT 0,
  total_item numeric(14,2) NOT NULL DEFAULT 0,
  meta jsonb
);
CREATE INDEX IF NOT EXISTS idx_mkoi_order ON public.mk_order_items(order_id);

-- 3) CÓDIGOS Y TOTALES
CREATE SEQUENCE IF NOT EXISTS sec_mk_order;
CREATE OR REPLACE FUNCTION public.fn_next_mk_num() RETURNS text
LANGUAGE sql STABLE AS $$ SELECT 'MK-'||extract(year from now())::int||'-'||to_char(nextval('sec_mk_order'),'FM000000'); $$;

CREATE OR REPLACE FUNCTION public.fn_set_mk_num() RETURNS trigger AS $$
BEGIN IF NEW.numero IS NULL THEN NEW.numero:=public.fn_next_mk_num(); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_mk_num ON public.mk_orders;
CREATE TRIGGER trg_set_mk_num BEFORE INSERT ON public.mk_orders FOR EACH ROW EXECUTE FUNCTION public.fn_set_mk_num();

CREATE OR REPLACE FUNCTION public.fn_mk_item_before() RETURNS trigger AS $$
BEGIN NEW.total_item := (NEW.cantidad*NEW.precio_unit)*(1+(COALESCE(NEW.iva_pct,0)/100.0)); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mk_item_before ON public.mk_order_items;
CREATE TRIGGER trg_mk_item_before BEFORE INSERT OR UPDATE ON public.mk_order_items FOR EACH ROW EXECUTE FUNCTION public.fn_mk_item_before();

CREATE OR REPLACE FUNCTION public.fn_mk_recalc_totales(_id uuid) RETURNS void AS $$
DECLARE _tot numeric(14,2); _imp numeric(14,2); _sub numeric(14,2);
BEGIN
  SELECT COALESCE(SUM(total_item),0) INTO _tot FROM public.mk_order_items WHERE order_id=_id;
  SELECT COALESCE(SUM((cantidad * precio_unit * iva_pct)/100.0),0) INTO _imp FROM public.mk_order_items WHERE order_id=_id;
  _sub := COALESCE(_tot,0)-COALESCE(_imp,0);
  UPDATE public.mk_orders SET subtotal=_sub, impuestos=_imp, total=_tot WHERE id=_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.fn_mk_item_after() RETURNS trigger AS $$
BEGIN 
  IF TG_OP = 'DELETE' THEN
    PERFORM public.fn_mk_recalc_totales(OLD.order_id);
    RETURN OLD;
  ELSE
    PERFORM public.fn_mk_recalc_totales(NEW.order_id);
    RETURN NEW;
  END IF;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mk_item_after_ins_upd ON public.mk_order_items;
CREATE TRIGGER trg_mk_item_after_ins_upd AFTER INSERT OR UPDATE ON public.mk_order_items FOR EACH ROW EXECUTE FUNCTION public.fn_mk_item_after();

DROP TRIGGER IF EXISTS trg_mk_item_after_del ON public.mk_order_items;
CREATE TRIGGER trg_mk_item_after_del AFTER DELETE ON public.mk_order_items FOR EACH ROW EXECUTE FUNCTION public.fn_mk_item_after();

-- 4) COMISIONES Y LIQUIDACIONES
CREATE TABLE IF NOT EXISTS public.mk_commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('fija_pct','fija_valor','escala')),
  valor numeric(10,4) NOT NULL DEFAULT 0,      -- pct o valor fijo
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.mk_commission_rules IS 'Reglas para calcular la comisión que el marketplace cobra a la empresa socia.';
COMMENT ON COLUMN public.mk_commission_rules.valor IS 'Porcentaje (ej. 15.5) o valor fijo (ej. 5000).';

CREATE TABLE IF NOT EXISTS public.mk_commissions (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.mk_orders(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  base numeric(14,2) NOT NULL,
  pct numeric(7,4) NOT NULL DEFAULT 0,
  valor numeric(14,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.mk_commissions IS 'Registro de la comisión calculada para cada pedido.';
COMMENT ON COLUMN public.mk_commissions.base IS 'Monto sobre el cual se calcula la comisión (ej. subtotal del pedido).';

CREATE INDEX IF NOT EXISTS idx_mkc_order ON public.mk_commissions(order_id);

CREATE TABLE IF NOT EXISTS public.mk_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo text NOT NULL,                       -- ej '2025-01'
  total_ordenes numeric(14,2) NOT NULL DEFAULT 0,
  total_comisiones numeric(14,2) NOT NULL DEFAULT 0,
  neto_a_pagar numeric(14,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','programado','pagado')),
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.mk_payouts IS 'Liquidaciones periódicas a las empresas socias.';
COMMENT ON COLUMN public.mk_payouts.neto_a_pagar IS 'Monto final a transferir a la empresa (total_ordenes - total_comisiones).';

CREATE TABLE IF NOT EXISTS public.mk_payout_items (
  id bigserial PRIMARY KEY,
  payout_id uuid NOT NULL REFERENCES public.mk_payouts(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.mk_orders(id) ON DELETE RESTRICT,
  comision_id bigint NOT NULL REFERENCES public.mk_commissions(id) ON DELETE RESTRICT,
  monto numeric(14,2) NOT NULL
);

-- 5) LOGÍSTICA (envíos)
CREATE TABLE IF NOT EXISTS public.mk_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.mk_orders(id) ON DELETE CASCADE,
  carrier text,                                 -- transportadora
  tracking text,
  costo numeric(14,2),
  estado text DEFAULT 'generado' CHECK (estado IN ('generado','en_transito','entregado','fallido')),
  etiqueta_url text,                             -- si se integra API
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mks_order ON public.mk_shipments(order_id);

-- 6) VISTAS
CREATE OR REPLACE VIEW public.v_mk_orders_resumen AS
SELECT o.id, o.numero, o.estado, o.total, e.nombre AS empresa, o.created_at
FROM public.mk_orders o JOIN public.empresas e ON e.id=o.empresa_id
ORDER BY o.created_at DESC;

END;
$$;

COMMIT;

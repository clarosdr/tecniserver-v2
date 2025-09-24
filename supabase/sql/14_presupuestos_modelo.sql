-- Script para el Módulo de Presupuestos de TecniServer V3
-- Archivo: supabase/sql/14_presupuestos_modelo.sql
-- Este script es idempotente y transaccional.

BEGIN;

DO $$
BEGIN

----------------------------------------------------
-- SECCIÓN 1: ESTRUCTURA DE TABLAS BASE
----------------------------------------------------

-- Tabla principal para almacenar los presupuestos (cotizaciones).
-- Puede estar vinculada opcionalmente a una Orden de Trabajo (OT).
COMMENT ON TABLE public.presupuestos IS 'Almacena las cotizaciones o presupuestos generados para los clientes.';
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,                            -- Número visible y único, ej: PRE-2025-000123
  ot_id uuid NULL REFERENCES public.ot(id) ON DELETE SET NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  fecha timestamptz NOT NULL DEFAULT now(),
  vence_at date NULL,                            -- Fecha de vencimiento de la oferta
  estado text NOT NULL DEFAULT 'borrador' CHECK (
    estado IN ('borrador','enviado','aprobado','rechazado','vencido','convertido')
  ),
  diagnostico text,                              -- Diagnóstico técnico (preliminar/final)
  observaciones text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  impuestos numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  creada_por uuid NOT NULL REFERENCES auth.users(id),
  aprobada_por uuid NULL REFERENCES auth.users(id),   -- Quién del personal interno aprueba
  aprobada_cliente_at timestamptz NULL,               -- Cuándo el cliente aprueba (portal/enlace)
  created_at timestamptz DEFAULT now()
);
-- Comentarios en columnas clave para mayor claridad
COMMENT ON COLUMN public.presupuestos.estado IS 'Ciclo de vida del presupuesto: borrador, enviado, aprobado, rechazado, vencido, o convertido a venta/OT.';
COMMENT ON COLUMN public.presupuestos.vence_at IS 'Fecha hasta la cual la oferta del presupuesto es válida.';
COMMENT ON COLUMN public.presupuestos.aprobada_cliente_at IS 'Timestamp de cuándo el cliente aprobó formalmente el presupuesto.';

-- Tabla para los ítems (productos o servicios) de cada presupuesto.
COMMENT ON TABLE public.presupuesto_items IS 'Detalle de productos y servicios incluidos en un presupuesto.';
CREATE TABLE IF NOT EXISTS public.presupuesto_items (
  id bigserial PRIMARY KEY,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  cantidad int NOT NULL CHECK (cantidad > 0),
  precio_unit numeric(14,2) NOT NULL CHECK (precio_unit >= 0),
  iva_pct decimal(5,2) NOT NULL DEFAULT 0,
  total_item numeric(14,2) NOT NULL DEFAULT 0,
  nota text
);
CREATE INDEX IF NOT EXISTS idx_pi_presupuesto ON public.presupuesto_items(presupuesto_id);

-- Tabla para registrar firmas de aprobación (simplificada).
COMMENT ON TABLE public.presupuesto_firmas IS 'Almacena las firmas digitales asociadas a la aprobación de un presupuesto.';
CREATE TABLE IF NOT EXISTS public.presupuesto_firmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  firmante text NOT NULL,                         -- Nombre o email del firmante
  role_firmante text,                             -- Rol del firmante: 'cliente', 'admin', 'tecnico', etc.
  signed_at timestamptz NOT NULL DEFAULT now(),
  signature_hash text NOT NULL                    -- Contendrá el hash o base64 de la firma
);
COMMENT ON COLUMN public.presupuesto_firmas.signature_hash IS 'Contiene el hash o la representación en base64 de la firma digital. Placeholder para integración futura con un proveedor de firma electrónica.';
CREATE INDEX IF NOT EXISTS idx_pf_presupuesto ON public.presupuesto_firmas(presupuesto_id);


----------------------------------------------------
-- SECCIÓN 2: SECUENCIA Y NUMERACIÓN AUTOMÁTICA
----------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS sec_presupuesto;

-- Función para generar el siguiente número de presupuesto formateado.
CREATE OR REPLACE FUNCTION public.fn_next_presupuesto_num() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT 'PRE-' || EXTRACT(YEAR FROM now())::int || '-' || to_char(nextval('sec_presupuesto'),'FM000000');
$$;

-- Trigger que asigna el número de presupuesto antes de insertar.
CREATE OR REPLACE FUNCTION public.fn_set_presupuesto_num() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL THEN NEW.numero := public.fn_next_presupuesto_num(); END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_presupuesto_num ON public.presupuestos;
CREATE TRIGGER trg_set_presupuesto_num
BEFORE INSERT ON public.presupuestos
FOR EACH ROW EXECUTE FUNCTION public.fn_set_presupuesto_num();


----------------------------------------------------
-- SECCIÓN 3: CÁLCULO AUTOMÁTICO DE TOTALES
----------------------------------------------------

-- Trigger para calcular el total de un ítem (incluyendo IVA) antes de guardarlo.
CREATE OR REPLACE FUNCTION public.fn_pi_before() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.total_item := (NEW.cantidad * NEW.precio_unit) * (1 + (COALESCE(NEW.iva_pct,0)/100.0));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_pi_before ON public.presupuesto_items;
CREATE TRIGGER trg_pi_before
BEFORE INSERT OR UPDATE ON public.presupuesto_items
FOR EACH ROW EXECUTE FUNCTION public.fn_pi_before();

-- Función para recalcular los totales (subtotal, impuestos, total) de un presupuesto.
CREATE OR REPLACE FUNCTION public.fn_recalc_totales_presupuesto(_pres uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE 
  _tot numeric(14,2); 
  _imp numeric(14,2); 
  _sub numeric(14,2);
BEGIN
  -- Suma el total de todos los ítems para obtener el total general.
  SELECT COALESCE(SUM(total_item),0) INTO _tot
  FROM public.presupuesto_items WHERE presupuesto_id = _pres;

  -- Extrae el monto de impuestos de cada ítem (asumiendo que total_item ya incluye IVA).
  SELECT COALESCE(SUM((total_item * iva_pct)/(100+iva_pct)),0) INTO _imp
  FROM public.presupuesto_items WHERE presupuesto_id = _pres;

  -- El subtotal es el total menos los impuestos.
  _sub := COALESCE(_tot,0) - COALESCE(_imp,0);

  -- Actualiza la tabla de presupuestos con los valores calculados.
  UPDATE public.presupuestos
  SET subtotal=_sub, impuestos=_imp, total=_tot
  WHERE id=_pres;
END; $$;

-- Trigger que recalcula totales después de insertar o actualizar un ítem.
CREATE OR REPLACE FUNCTION public.fn_pi_after() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.fn_recalc_totales_presupuesto(NEW.presupuesto_id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_pi_after ON public.presupuesto_items;
CREATE TRIGGER trg_pi_after
AFTER INSERT OR UPDATE ON public.presupuesto_items
FOR EACH ROW EXECUTE FUNCTION public.fn_pi_after();

-- Trigger que recalcula totales después de eliminar un ítem.
CREATE OR REPLACE FUNCTION public.fn_pi_after_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.fn_recalc_totales_presupuesto(OLD.presupuesto_id);
  RETURN OLD;
END; $$;

DROP TRIGGER IF EXISTS trg_pi_after_delete ON public.presupuesto_items;
CREATE TRIGGER trg_pi_after_delete
AFTER DELETE ON public.presupuesto_items
FOR EACH ROW EXECUTE FUNCTION public.fn_pi_after_delete();


----------------------------------------------------
-- SECCIÓN 4: VIGENCIA AUTOMÁTICA
----------------------------------------------------

-- Trigger para establecer una fecha de vencimiento por defecto de 15 días.
CREATE OR REPLACE FUNCTION public.fn_pre_set_vencimiento() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.vence_at IS NULL THEN
    NEW.vence_at := (now() + interval '15 days')::date;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_pre_set_vencimiento ON public.presupuestos;
CREATE TRIGGER trg_pre_set_vencimiento
BEFORE INSERT ON public.presupuestos
FOR EACH ROW EXECUTE FUNCTION public.fn_pre_set_vencimiento();


----------------------------------------------------
-- SECCIÓN 5: LÓGICA DE CAMBIOS DE ESTADO
----------------------------------------------------

-- Trigger placeholder para la lógica de bloqueo. El bloqueo real se implementará con RLS.
CREATE OR REPLACE FUNCTION public.fn_pre_lock_on_approved() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  -- La lógica real de bloqueo se implementará mediante Políticas de Seguridad a Nivel de Fila (RLS)
  -- en la tabla `presupuesto_items`, permitiendo la edición solo si el estado del presupuesto es 'borrador'
  -- o si el usuario es un administrador. Este trigger sirve como un recordatorio de esa lógica.
  IF NEW.estado IN ('aprobado','convertido') AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    -- No se necesita acción aquí; RLS se encargará del bloqueo.
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_pre_lock_on_approved ON public.presupuestos;
CREATE TRIGGER trg_pre_lock_on_approved
AFTER UPDATE ON public.presupuestos
FOR EACH ROW EXECUTE FUNCTION public.fn_pre_lock_on_approved();


----------------------------------------------------
-- SECCIÓN 6: CONVERSIÓN A VENTA (POS)
----------------------------------------------------

-- Función que convierte un presupuesto aprobado en una venta abierta en el sistema POS.
CREATE OR REPLACE FUNCTION public.fn_convert_presupuesto_to_venta(_pres uuid, _caja_apertura uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE 
  _venta uuid; 
  _c_id uuid; 
  _ot uuid;
BEGIN
  -- Se busca el presupuesto y se valida que esté en estado 'aprobado'.
  SELECT cliente_id, ot_id INTO _c_id, _ot 
  FROM public.presupuestos 
  WHERE id=_pres AND estado = 'aprobado';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado o no está en estado aprobado';
  END IF;

  -- Se inserta una nueva venta con los datos del presupuesto.
  INSERT INTO public.ventas(cliente_id, ot_id, observaciones, creada_por, caja_apertura_id)
  VALUES (_c_id, _ot, 'Generado desde presupuesto '||_pres::text, auth.uid(), _caja_apertura)
  RETURNING id INTO _venta;

  -- Se actualiza el estado del presupuesto a 'convertido'.
  UPDATE public.presupuestos SET estado='convertido' WHERE id=_pres;
  
  RETURN _venta;
END; $$;


----------------------------------------------------
-- SECCIÓN 7: VISTAS
----------------------------------------------------

-- Vista para obtener un resumen rápido de los presupuestos y sus datos asociados.
CREATE OR REPLACE VIEW public.v_presupuestos_resumen AS
SELECT 
  p.id, 
  p.numero, 
  p.fecha, 
  p.vence_at, 
  p.estado, 
  p.total,
  p.cliente_id, 
  c.nombre AS cliente_nombre,
  p.ot_id, 
  o.ot_code
FROM public.presupuestos p
JOIN public.clientes c ON c.id = p.cliente_id
LEFT JOIN public.ot o ON o.id = p.ot_id
ORDER BY p.fecha DESC;


END;
$$;

COMMIT;

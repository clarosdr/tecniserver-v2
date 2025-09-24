-- supabase/sql/12_pos_modelo.sql
-- SECCIÓN 7 — Módulo de Punto de Venta (POS)
-- Crea un modelo de datos completo para la gestión de ventas, cajas y pagos.
-- Idempotente: Se puede ejecutar varias veces sin causar errores.

BEGIN;

--------------------------------------------------------------------------------
-- 1) TABLAS BASE DEL MÓDULO POS
--------------------------------------------------------------------------------
DO $$
BEGIN
    -- Catálogo de cajas físicas o puntos de venta.
    CREATE TABLE IF NOT EXISTS public.cajas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre text NOT NULL UNIQUE,
      created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Tabla public.cajas creada o ya existente.';

    -- Registra los turnos de apertura y cierre de cada caja.
    CREATE TABLE IF NOT EXISTS public.caja_aperturas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      caja_id uuid NOT NULL REFERENCES public.cajas(id) ON DELETE RESTRICT,
      abierto_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
      fecha_apertura timestamptz NOT NULL DEFAULT now(),
      saldo_inicial numeric(14,2) NOT NULL DEFAULT 0 CHECK (saldo_inicial >= 0),
      cerrado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
      fecha_cierre timestamptz NULL,
      saldo_cierre numeric(14,2) NULL,
      estado text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada'))
    );
    RAISE NOTICE 'Tabla public.caja_aperturas creada o ya existente.';

    -- Tabla principal de ventas/facturas.
    CREATE TABLE IF NOT EXISTS public.ventas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      numero text UNIQUE,                       -- Consecutivo visible (ej: POS-2024-000123)
      cliente_id uuid NULL REFERENCES public.clientes(id) ON DELETE SET NULL,
      ot_id uuid NULL REFERENCES public.ot(id) ON DELETE SET NULL, -- Si la venta se origina desde una OT
      fecha timestamptz NOT NULL DEFAULT now(),
      subtotal numeric(14,2) NOT NULL DEFAULT 0,
      impuestos numeric(14,2) NOT NULL DEFAULT 0,
      total numeric(14,2) NOT NULL DEFAULT 0,
      estado text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','pagada','anulada','devuelta')),
      observaciones text,
      creada_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
      caja_apertura_id uuid NULL REFERENCES public.caja_aperturas(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Tabla public.ventas creada o ya existente.';

    -- Líneas de detalle para cada venta.
    CREATE TABLE IF NOT EXISTS public.venta_items (
      id bigserial PRIMARY KEY,
      venta_id uuid NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
      producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
      lote_id uuid NULL REFERENCES public.producto_lotes(id) ON DELETE SET NULL,
      cantidad int NOT NULL CHECK (cantidad > 0),
      precio_unit numeric(14,2) NOT NULL CHECK (precio_unit >= 0),
      iva_pct decimal(5,2) NOT NULL DEFAULT 0,
      total_item numeric(14,2) NOT NULL DEFAULT 0 -- Calculado por trigger
    );
    RAISE NOTICE 'Tabla public.venta_items creada o ya existente.';

    -- Registros de pago asociados a una venta.
    CREATE TABLE IF NOT EXISTS public.pagos (
      id bigserial PRIMARY KEY,
      venta_id uuid NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
      metodo text NOT NULL CHECK (metodo IN ('efectivo','tarjeta','transferencia','bono')),
      monto numeric(14,2) NOT NULL CHECK (monto > 0),
      referencia text,                            -- voucher, número de transacción
      created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Tabla public.pagos creada o ya existente.';

    -- Notas de crédito para devoluciones.
    CREATE TABLE IF NOT EXISTS public.notas_credito (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      venta_id uuid NOT NULL REFERENCES public.ventas(id) ON DELETE RESTRICT, -- RESTRICT para evitar borrar venta original
      numero text UNIQUE,
      fecha timestamptz NOT NULL DEFAULT now(),
      motivo text,
      total numeric(14,2) NOT NULL CHECK (total >= 0),
      creada_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
    );
    RAISE NOTICE 'Tabla public.notas_credito creada o ya existente.';

    -- Índices para optimizar consultas
    CREATE INDEX IF NOT EXISTS idx_cj_ap_caja ON public.caja_aperturas(caja_id);
    CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha);
    CREATE INDEX IF NOT EXISTS idx_ventas_estado ON public.ventas(estado);
    CREATE INDEX IF NOT EXISTS idx_vi_venta ON public.venta_items(venta_id);
    CREATE INDEX IF NOT EXISTS idx_pagos_venta ON public.pagos(venta_id);
    CREATE INDEX IF NOT EXISTS idx_nc_venta ON public.notas_credito(venta_id);
    RAISE NOTICE 'Índices para tablas de POS creados o ya existentes.';
END $$;


--------------------------------------------------------------------------------
-- 2) SECUENCIAS Y CONSECUTIVOS AUTOMÁTICOS
--------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS sec_venta START WITH 1;
CREATE OR REPLACE FUNCTION public.fn_next_venta_num() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT 'POS-' || extract(year from now())::text || '-' || to_char(nextval('sec_venta'),'FM000000');
$$;
RAISE NOTICE 'Secuencia y función para consecutivos de ventas creadas o actualizadas.';

CREATE SEQUENCE IF NOT EXISTS sec_nota_credito START WITH 1;
CREATE OR REPLACE FUNCTION public.fn_next_nc_num() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT 'NC-' || extract(year from now())::text || '-' || to_char(nextval('sec_nota_credito'),'FM000000');
$$;
RAISE NOTICE 'Secuencia y función para consecutivos de notas de crédito creadas o actualizadas.';

-- Trigger para asignar número de venta
CREATE OR REPLACE FUNCTION public.fn_set_venta_num() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL THEN NEW.numero := public.fn_next_venta_num(); END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_set_venta_num ON public.ventas;
CREATE TRIGGER trg_set_venta_num BEFORE INSERT ON public.ventas FOR EACH ROW EXECUTE FUNCTION public.fn_set_venta_num();
RAISE NOTICE 'Trigger trg_set_venta_num configurado en public.ventas.';

-- Trigger para asignar número de nota de crédito
CREATE OR REPLACE FUNCTION public.fn_set_nc_num() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL THEN NEW.numero := public.fn_next_nc_num(); END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_set_nc_num ON public.notas_credito;
CREATE TRIGGER trg_set_nc_num BEFORE INSERT ON public.notas_credito FOR EACH ROW EXECUTE FUNCTION public.fn_set_nc_num();
RAISE NOTICE 'Trigger trg_set_nc_num configurado en public.notas_credito.';


--------------------------------------------------------------------------------
-- 3) CÁLCULO DE TOTALES (AUTOMATIZADO)
--------------------------------------------------------------------------------
-- Recalcula los totales de la venta a partir de sus items.
CREATE OR REPLACE FUNCTION public.fn_recalc_totales_venta(_venta_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  _subtotal numeric(14,2);
  _impuestos numeric(14,2);
  _total numeric(14,2);
BEGIN
  SELECT
    COALESCE(SUM(precio_unit * cantidad), 0),
    COALESCE(SUM(precio_unit * cantidad * (iva_pct / 100.0)), 0)
  INTO _subtotal, _impuestos
  FROM public.venta_items
  WHERE venta_id = _venta_id;

  _total := _subtotal + _impuestos;

  UPDATE public.ventas SET subtotal = _subtotal, impuestos = _impuestos, total = _total WHERE id = _venta_id;
END; $$;
RAISE NOTICE 'Función fn_recalc_totales_venta creada o actualizada.';

-- Calcula el total de un item de venta antes de guardarlo.
CREATE OR REPLACE FUNCTION public.fn_vi_before() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- El total_item ya no incluye IVA, se calcula en la función de totales
  NEW.total_item := NEW.cantidad * NEW.precio_unit;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_vi_before ON public.venta_items;
CREATE TRIGGER trg_vi_before BEFORE INSERT OR UPDATE ON public.venta_items FOR EACH ROW EXECUTE FUNCTION public.fn_vi_before();

-- Después de modificar un item, recalcula los totales de la venta.
CREATE OR REPLACE FUNCTION public.fn_vi_after() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.fn_recalc_totales_venta(OLD.venta_id);
  ELSE
    PERFORM public.fn_recalc_totales_venta(NEW.venta_id);
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_vi_after ON public.venta_items;
CREATE TRIGGER trg_vi_after AFTER INSERT OR UPDATE OR DELETE ON public.venta_items FOR EACH ROW EXECUTE FUNCTION public.fn_vi_after();
RAISE NOTICE 'Triggers para recalcular totales de venta configurados en public.venta_items.';


--------------------------------------------------------------------------------
-- 4) INTEGRACIÓN AUTOMÁTICA CON INVENTARIO
--------------------------------------------------------------------------------
-- Al insertar un item de venta, genera una salida de inventario.
CREATE OR REPLACE FUNCTION public.fn_inv_on_item_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.movimientos_inventario(almacen_id, producto_id, lote_id, tipo, cantidad, referencia, created_by, metadata)
  VALUES (
    (SELECT id FROM public.almacenes ORDER BY created_at LIMIT 1), -- TODO: Parametrizar almacen_id desde la sesión o UI
    NEW.producto_id,
    NEW.lote_id,
    'salida',
    NEW.cantidad,
    (SELECT numero FROM public.ventas WHERE id = NEW.venta_id), -- Usa el número de venta como referencia
    auth.uid(),
    jsonb_build_object('venta_id', NEW.venta_id)
  );
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_inv_on_item_insert ON public.venta_items;
CREATE TRIGGER trg_inv_on_item_insert AFTER INSERT ON public.venta_items FOR EACH ROW EXECUTE FUNCTION public.fn_inv_on_item_insert();
COMMENT ON TRIGGER trg_inv_on_item_insert ON public.venta_items IS 'Descuenta automáticamente el stock al agregar un ítem a una venta.';

-- Al crear una nota de crédito, genera una entrada a inventario por devolución.
CREATE OR REPLACE FUNCTION public.fn_inv_on_nc_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _venta_numero text;
BEGIN
  -- Reingresar todos los items de la venta original (se puede extender para devoluciones parciales)
  INSERT INTO public.movimientos_inventario(almacen_id, producto_id, lote_id, tipo, cantidad, referencia, created_by, metadata)
  SELECT
    (SELECT id FROM public.almacenes ORDER BY created_at LIMIT 1), -- TODO: Parametrizar
    vi.producto_id,
    vi.lote_id,
    'devolucion_venta',
    vi.cantidad,
    NEW.numero, -- Usa el número de la nota de crédito como referencia
    auth.uid(),
    jsonb_build_object('nota_credito_id', NEW.id, 'venta_original_id', NEW.venta_id)
  FROM public.venta_items vi
  WHERE vi.venta_id = NEW.venta_id;

  -- Actualizar el estado de la venta original
  UPDATE public.ventas SET estado = 'devuelta' WHERE id = NEW.venta_id AND estado <> 'anulada';
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_inv_on_nc_insert ON public.notas_credito;
CREATE TRIGGER trg_inv_on_nc_insert AFTER INSERT ON public.notas_credito FOR EACH ROW EXECUTE FUNCTION public.fn_inv_on_nc_insert();
COMMENT ON TRIGGER trg_inv_on_nc_insert ON public.notas_credito IS 'Reingresa automáticamente el stock al crear una nota de crédito por devolución.';


--------------------------------------------------------------------------------
-- 5) LÓGICA DE ESTADOS Y CIERRE DE VENTA
--------------------------------------------------------------------------------
-- Después de registrar un pago, verifica si la venta está completamente pagada.
CREATE OR REPLACE FUNCTION public.fn_after_pago() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  _pagado numeric(14,2);
  _total_venta numeric(14,2);
  _venta_id uuid;
BEGIN
  _venta_id := COALESCE(NEW.venta_id, OLD.venta_id);
  
  SELECT COALESCE(SUM(monto), 0) INTO _pagado FROM public.pagos WHERE venta_id = _venta_id;
  SELECT total INTO _total_venta FROM public.ventas WHERE id = _venta_id;

  IF _pagado >= _total_venta THEN
    UPDATE public.ventas SET estado = 'pagada' WHERE id = _venta_id AND estado = 'abierta';
  END IF;
  
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_after_pago ON public.pagos;
CREATE TRIGGER trg_after_pago AFTER INSERT OR UPDATE OR DELETE ON public.pagos FOR EACH ROW EXECUTE FUNCTION public.fn_after_pago();
RAISE NOTICE 'Trigger trg_after_pago configurado en public.pagos para actualizar estado de venta.';

--------------------------------------------------------------------------------
-- 6) COMENTARIOS (DOCUMENTACIÓN)
--------------------------------------------------------------------------------
COMMENT ON COLUMN public.ventas.numero IS 'Consecutivo autogenerado y visible para el cliente. Formato: POS-AÑO-XXXXXX.';
COMMENT ON COLUMN public.ventas.estado IS 'Estado de la venta: abierta (pendiente de pago), pagada, anulada (no afecta inventario ni caja), devuelta (afecta inventario vía nota de crédito).';
COMMENT ON COLUMN public.ventas.caja_apertura_id IS 'Vincula la venta a un turno de caja específico para arqueos y reportes.';

-- Seeds mínimos
DO $$
BEGIN
    INSERT INTO public.cajas(nombre) VALUES ('Caja Principal') ON CONFLICT (nombre) DO NOTHING;
END $$;


COMMIT;

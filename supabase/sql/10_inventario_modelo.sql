-- supabase/sql/10_inventario_modelo.sql
-- SECCIÓN 6 — Módulo de Inventario Avanzado
-- Crea un modelo de datos robusto para la gestión de productos, lotes y stock en múltiples almacenes.
-- Idempotente: Se puede ejecutar varias veces sin causar errores.

BEGIN;

--------------------------------------------------------------------------------
-- 1) TABLAS BASE Y CATÁLOGOS
--------------------------------------------------------------------------------
DO $$
BEGIN
    -- Catálogo de almacenes/sedes para soportar múltiples ubicaciones.
    CREATE TABLE IF NOT EXISTS public.almacenes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre text NOT NULL UNIQUE,
      created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Tabla public.almacenes creada o ya existente.';

    -- Catálogo central de productos/servicios.
    CREATE TABLE IF NOT EXISTS public.productos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      sku text NOT NULL UNIQUE,
      nombre text NOT NULL,
      categoria text,
      precio numeric(12,2) NOT NULL CHECK (precio >= 0),
      costo numeric(12,2) NOT NULL CHECK (costo >= 0),
      iva decimal(5,2) DEFAULT 19.00 CHECK (iva BETWEEN 0 AND 100), -- % (ej 19.00)
      unidad text DEFAULT 'und',
      activo boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Tabla public.productos creada o ya existente.';

    -- Lotes para control de vencimiento/garantía de un producto específico.
    CREATE TABLE IF NOT EXISTS public.producto_lotes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
      lote text,                                 -- Código del lote, visible en etiquetas
      vence_at date,                             -- Fecha de vencimiento (nullable si no aplica)
      garantia_meses int CHECK (garantia_meses >= 0), -- Meses de garantía del fabricante
      created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Tabla public.producto_lotes creada o ya existente.';

    -- Tabla pivote que registra la cantidad de stock por almacén, producto y lote.
    CREATE TABLE IF NOT EXISTS public.stock (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      almacen_id uuid NOT NULL REFERENCES public.almacenes(id) ON DELETE RESTRICT,
      producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
      lote_id uuid REFERENCES public.producto_lotes(id) ON DELETE SET NULL, -- NULL si no se manejan lotes
      cantidad int NOT NULL CHECK (cantidad >= 0),
      UNIQUE (almacen_id, producto_id, lote_id),
      created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Tabla public.stock creada o ya existente.';

    -- Historial de todos los movimientos de inventario (Kardex).
    CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
      id bigserial PRIMARY KEY,
      almacen_id uuid NOT NULL REFERENCES public.almacenes(id),
      producto_id uuid NOT NULL REFERENCES public.productos(id),
      lote_id uuid REFERENCES public.producto_lotes(id),
      tipo text NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','devolucion_venta','devolucion_compra','garantia_salida','garantia_reingreso')),
      cantidad int NOT NULL CHECK (cantidad > 0),
      referencia text,                            -- ej: OT-xxxx, FACT-xxxx, PROV-xxxx
      metadata jsonb,                             -- datos adjuntos (cliente/proveedor, motivo)
      created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Tabla public.movimientos_inventario creada o ya existente.';
    
    -- Índices para optimizar consultas
    CREATE INDEX IF NOT EXISTS idx_prod_nombre ON public.productos (LOWER(nombre));
    CREATE INDEX IF NOT EXISTS idx_lotes_prod ON public.producto_lotes(producto_id);
    CREATE INDEX IF NOT EXISTS idx_lotes_vence ON public.producto_lotes(vence_at);
    CREATE INDEX IF NOT EXISTS idx_stock_producto ON public.stock(producto_id);
    CREATE INDEX IF NOT EXISTS idx_mov_tipo ON public.movimientos_inventario(tipo);
    CREATE INDEX IF NOT EXISTS idx_mov_prod ON public.movimientos_inventario(producto_id);
    CREATE INDEX IF NOT EXISTS idx_mov_fecha ON public.movimientos_inventario(created_at);
    RAISE NOTICE 'Índices para tablas de inventario creados o ya existentes.';
END $$;


--------------------------------------------------------------------------------
-- 2) FUNCIONES DE STOCK
--------------------------------------------------------------------------------
-- Traduce un tipo de movimiento a un delta (+/-) para afectar el stock.
CREATE OR REPLACE FUNCTION public.fn_mov_to_delta(_tipo text, _cant int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _tipo
    WHEN 'entrada'             THEN  +_cant -- Compra a proveedor
    WHEN 'devolucion_venta'    THEN  +_cant -- Cliente devuelve producto, reingresa a stock
    WHEN 'garantia_reingreso'  THEN  +_cant -- Producto regresa de RMA del proveedor
    WHEN 'salida'              THEN  -_cant -- Venta o uso en OT
    WHEN 'devolucion_compra'   THEN  -_cant -- Devolución a proveedor
    WHEN 'garantia_salida'     THEN  -_cant -- Producto se envía a RMA de proveedor
    WHEN 'ajuste'              THEN  0      -- El ajuste se maneja con una lógica separada si es necesario, no afecta stock directamente
    ELSE 0 END;
$$;
RAISE NOTICE 'Función fn_mov_to_delta creada o actualizada.';

-- Asegura que una fila de stock exista y aplica un cambio (delta) a la cantidad.
-- Usa UPSERT para ser atómico y eficiente.
CREATE OR REPLACE FUNCTION public.fn_apply_stock_delta(_alm uuid, _prod uuid, _lote uuid, _delta int)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.stock(almacen_id, producto_id, lote_id, cantidad)
  VALUES (_alm, _prod, _lote, GREATEST(0, _delta)) -- Si es el primer movimiento, la cantidad no puede ser negativa
  ON CONFLICT (almacen_id, producto_id, lote_id)
  DO UPDATE SET cantidad = GREATEST(0, public.stock.cantidad + _delta); -- Asegura que el stock nunca sea < 0
END;
$$;
RAISE NOTICE 'Función fn_apply_stock_delta creada o actualizada.';


--------------------------------------------------------------------------------
-- 3) TRIGGER PARA ACTUALIZAR STOCK AUTOMÁTICAMENTE
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_mov_apply()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  _delta int;
BEGIN
  _delta := public.fn_mov_to_delta(NEW.tipo, NEW.cantidad);

  -- Si es un movimiento de salida, aplicar validaciones
  IF _delta < 0 THEN
    -- Validación 1: No permitir salida de lotes vencidos
    IF NEW.lote_id IS NOT NULL THEN
      PERFORM 1 FROM public.producto_lotes l
      WHERE l.id = NEW.lote_id AND (l.vence_at IS NULL OR l.vence_at >= current_date);
      IF NOT FOUND THEN
        RAISE EXCEPTION 'No se puede realizar la salida: el lote del producto está vencido.';
      END IF;
    END IF;

    -- Validación 2: Verificar que haya stock suficiente
    PERFORM 1 FROM public.stock s
    WHERE s.almacen_id = NEW.almacen_id
      AND s.producto_id = NEW.producto_id
      AND COALESCE(s.lote_id, '00000000-0000-0000-0000-000000000000') = COALESCE(NEW.lote_id, '00000000-0000-0000-0000-000000000000')
      AND s.cantidad >= NEW.cantidad; -- Compara cantidad absoluta, no delta
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente para realizar la salida.';
    END IF;
  END IF;

  -- Aplicar el cambio en la tabla de stock
  PERFORM public.fn_apply_stock_delta(NEW.almacen_id, NEW.producto_id, NEW.lote_id, _delta);
  RETURN NEW;
END;
$$;
RAISE NOTICE 'Función de trigger fn_mov_apply creada o actualizada.';

-- Vincular el trigger a la tabla de movimientos.
DROP TRIGGER IF EXISTS trg_mov_apply ON public.movimientos_inventario;
CREATE TRIGGER trg_mov_apply
  AFTER INSERT ON public.movimientos_inventario
  FOR EACH ROW EXECUTE FUNCTION public.fn_mov_apply();
RAISE NOTICE 'Trigger trg_mov_apply configurado en public.movimientos_inventario.';


--------------------------------------------------------------------------------
-- 4) VISTAS ÚTILES
--------------------------------------------------------------------------------
-- Vista para obtener el stock total de un producto en un almacén, sumando todos los lotes.
CREATE OR REPLACE VIEW public.v_stock_resumen AS
  SELECT s.almacen_id, a.nombre as almacen_nombre, s.producto_id, p.sku, p.nombre as producto_nombre, p.categoria, SUM(s.cantidad) AS cantidad_total
  FROM public.stock s
  JOIN public.almacenes a ON s.almacen_id = a.id
  JOIN public.productos p ON s.producto_id = p.id
  GROUP BY s.almacen_id, a.nombre, s.producto_id, p.sku, p.nombre, p.categoria;
RAISE NOTICE 'Vista v_stock_resumen creada o actualizada.';

-- Vista para identificar lotes que están próximos a vencer (en los próximos 30 días).
CREATE OR REPLACE VIEW public.v_lotes_por_vencer AS
  SELECT l.*, p.sku, p.nombre, GREATEST(0, (l.vence_at - current_date)) AS dias_restantes
  FROM public.producto_lotes l
  JOIN public.productos p ON p.id = l.producto_id
  WHERE l.vence_at IS NOT NULL AND l.vence_at BETWEEN current_date AND (current_date + INTERVAL '30 days')
  ORDER BY l.vence_at ASC;
RAISE NOTICE 'Vista v_lotes_por_vencer creada o actualizada.';


--------------------------------------------------------------------------------
-- 5) SEEDS (DATOS INICIALES)
--------------------------------------------------------------------------------
DO $$
DECLARE
  main_almacen_id uuid;
  prod_a_id uuid;
  lote_a1_id uuid;
BEGIN
  -- Crear almacén principal si no existe
  INSERT INTO public.almacenes(nombre) VALUES ('Principal') ON CONFLICT (nombre) DO NOTHING;
  SELECT id INTO main_almacen_id FROM public.almacenes WHERE nombre = 'Principal';

  -- Crear producto de prueba si no existe
  INSERT INTO public.productos(sku, nombre, categoria, precio, costo)
  VALUES ('SSD-KNG-240', 'SSD Kingston 240GB', 'Almacenamiento', 150000, 95000)
  ON CONFLICT (sku) DO NOTHING;
  SELECT id INTO prod_a_id FROM public.productos WHERE sku = 'SSD-KNG-240';
  
  -- Crear un lote de prueba si no existe para ese producto
  INSERT INTO public.producto_lotes(producto_id, lote, vence_at)
  SELECT prod_a_id, 'LOTE202412', (current_date + interval '25 days')
  WHERE NOT EXISTS (SELECT 1 FROM public.producto_lotes WHERE producto_id = prod_a_id AND lote = 'LOTE202412');
  SELECT id INTO lote_a1_id FROM public.producto_lotes WHERE producto_id = prod_a_id AND lote = 'LOTE202412';

  -- Registrar una entrada inicial para poblar el stock (solo si no hay movimientos para este lote)
  IF lote_a1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.movimientos_inventario WHERE lote_id = lote_a1_id) THEN
    RAISE NOTICE 'Realizando carga inicial de stock para el producto de prueba...';
    INSERT INTO public.movimientos_inventario(almacen_id, producto_id, lote_id, tipo, cantidad, referencia)
    VALUES (main_almacen_id, prod_a_id, lote_a1_id, 'entrada', 10, 'SEED-INICIAL');
  END IF;
END $$;


--------------------------------------------------------------------------------
-- 6) COMENTARIOS (DOCUMENTACIÓN)
--------------------------------------------------------------------------------
COMMENT ON COLUMN public.producto_lotes.vence_at IS 'Fecha de caducidad del lote. El sistema bloqueará salidas de lotes vencidos.';
COMMENT ON COLUMN public.producto_lotes.garantia_meses IS 'Meses de garantía ofrecidos por el proveedor para este lote. Útil para RMA.';
COMMENT ON COLUMN public.movimientos_inventario.tipo IS 'Define la naturaleza del movimiento: entrada (compra), salida (venta/uso), ajuste (conteo físico), devolucion_venta (reingreso), devolucion_compra (salida a proveedor), garantia_salida (envío a RMA), garantia_reingreso (retorno de RMA).';

COMMIT;

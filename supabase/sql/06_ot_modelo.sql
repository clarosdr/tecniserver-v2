-- supabase/sql/06_ot_modelo.sql
-- SECCIÓN 4 — Órdenes de Trabajo (OT)
-- Creación del modelo de datos completo para la gestión de Órdenes de Trabajo.
-- Idempotente: Se puede ejecutar varias veces sin causar errores.

BEGIN;

-- 1) TABLAS BASE Y ESTRUCTURAS
--------------------------------------------------------------------------------

DO $$
BEGIN
  -- Crear la secuencia para los códigos de OT si no existe
  CREATE SEQUENCE IF NOT EXISTS public.ot_seq;

  -- Crear la tabla principal de Órdenes de Trabajo (ot)
  CREATE TABLE IF NOT EXISTS public.ot (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ot_code text UNIQUE,
      equipo_id uuid NOT NULL,
      cliente_id uuid NOT NULL,
      tecnico_id uuid NULL,
      estado text NOT NULL CHECK (estado IN ('abierta','en_proceso','en_espera','esperando_cliente','cerrada','garantia')),
      prioridad int NOT NULL DEFAULT 3 CHECK (prioridad BETWEEN 1 AND 5),
      canal text NOT NULL DEFAULT 'taller' CHECK (canal IN ('taller','domicilio')),
      fecha_recepcion timestamptz NOT NULL DEFAULT now(),
      fecha_cita timestamptz NULL,
      diagnostico_preliminar text,
      observaciones text,
      turno_fecha date NULL,
      turno_pos int NULL,
      created_at timestamptz DEFAULT now(),
      
      CONSTRAINT fk_equipo FOREIGN KEY(equipo_id) REFERENCES public.equipos_cliente(id) ON DELETE RESTRICT,
      CONSTRAINT fk_cliente FOREIGN KEY(cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT,
      CONSTRAINT fk_tecnico FOREIGN KEY(tecnico_id) REFERENCES auth.users(id) ON DELETE SET NULL
  );
  RAISE NOTICE 'Tabla public.ot creada o ya existente.';
  
  -- Crear la tabla para los accesorios de una OT
  CREATE TABLE IF NOT EXISTS public.ot_accesorios (
      id bigserial PRIMARY KEY,
      ot_id uuid NOT NULL REFERENCES public.ot(id) ON DELETE CASCADE,
      descripcion text NOT NULL
  );
  RAISE NOTICE 'Tabla public.ot_accesorios creada o ya existente.';

  -- Crear la tabla para el historial de eventos de una OT
  CREATE TABLE IF NOT EXISTS public.ot_historial (
      id bigserial PRIMARY KEY,
      ot_id uuid NOT NULL REFERENCES public.ot(id) ON DELETE CASCADE,
      evento text NOT NULL,
      detalle text,
      actor uuid NULL REFERENCES auth.users(id),
      created_at timestamptz DEFAULT now()
  );
  RAISE NOTICE 'Tabla public.ot_historial creada o ya existente.';

  -- Crear la tabla para adjuntos de una OT
  CREATE TABLE IF NOT EXISTS public.ot_adjuntos (
      id bigserial PRIMARY KEY,
      ot_id uuid NOT NULL REFERENCES public.ot(id) ON DELETE CASCADE,
      titulo text,
      url text NOT NULL,
      created_at timestamptz DEFAULT now()
  );
  RAISE NOTICE 'Tabla public.ot_adjuntos creada o ya existente.';

  -- Crear índices para mejorar el rendimiento de las consultas
  CREATE INDEX IF NOT EXISTS idx_ot_equipo_id ON public.ot(equipo_id);
  CREATE INDEX IF NOT EXISTS idx_ot_cliente_id ON public.ot(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_ot_estado ON public.ot(estado);
  CREATE INDEX IF NOT EXISTS idx_ot_prioridad ON public.ot(prioridad);
  CREATE INDEX IF NOT EXISTS idx_ot_turno ON public.ot(turno_fecha, turno_pos);
  CREATE INDEX IF NOT EXISTS idx_ot_historial_ot_id_created_at ON public.ot_historial(ot_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_ot_accesorios_ot_id ON public.ot_accesorios(ot_id);
  CREATE INDEX IF NOT EXISTS idx_ot_adjuntos_ot_id ON public.ot_adjuntos(ot_id);
  RAISE NOTICE 'Índices para tablas de OT creados o ya existentes.';
  
END $$;


-- 2) GENERACIÓN DE CÓDIGO DE OT
--------------------------------------------------------------------------------

-- Función para generar el siguiente código de OT (ej: OT-2024-000001)
CREATE OR REPLACE FUNCTION public.fn_next_ot_code()
RETURNS text AS $$
BEGIN
  RETURN 'OT-' || date_part('year', now())::int || '-' || to_char(nextval('public.ot_seq'), 'FM000000');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
RAISE NOTICE 'Función fn_next_ot_code creada o actualizada.';

-- Trigger para asignar el código de OT antes de insertar
CREATE OR REPLACE FUNCTION public.fn_set_ot_code_on_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.ot_code IS NULL THEN
    NEW.ot_code := public.fn_next_ot_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_ot_code ON public.ot;
CREATE TRIGGER trg_set_ot_code
  BEFORE INSERT ON public.ot
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_ot_code_on_insert();
RAISE NOTICE 'Trigger para fn_set_ot_code_on_insert configurado en public.ot.';

-- 3) COLA / TURNOS
--------------------------------------------------------------------------------

-- Función para obtener la siguiente posición en la cola para un día y canal
CREATE OR REPLACE FUNCTION public.fn_next_turno_pos(_fecha date, _canal text)
RETURNS int AS $$
DECLARE
  next_pos int;
BEGIN
  SELECT COALESCE(MAX(turno_pos), 0) + 1 INTO next_pos
  FROM public.ot
  WHERE turno_fecha = _fecha AND canal = _canal;
  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;
RAISE NOTICE 'Función fn_next_turno_pos creada o actualizada.';

-- Trigger para asignar fecha y posición de turno antes de insertar
CREATE OR REPLACE FUNCTION public.fn_set_turno_on_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.turno_fecha IS NULL THEN
    NEW.turno_fecha := (timezone('UTC', now()))::date;
  END IF;
  IF NEW.turno_pos IS NULL THEN
    NEW.turno_pos := public.fn_next_turno_pos(NEW.turno_fecha, NEW.canal);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_turno ON public.ot;
CREATE TRIGGER trg_set_turno
  BEFORE INSERT ON public.ot
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_turno_on_insert();
RAISE NOTICE 'Trigger para fn_set_turno_on_insert configurado en public.ot.';

-- 4) VALIDACIÓN MODELO vs MARCA
--------------------------------------------------------------------------------
-- COMMENT: La consistencia entre marca y modelo ya se valida a nivel de la tabla `equipos_cliente`
-- y su relación con los catálogos. No es necesario repetir la lógica aquí, ya que se hereda
-- a través de la clave foránea `fk_equipo`.

-- 5) CAMBIOS DE ESTADO + HISTORIAL AUTOMÁTICO
--------------------------------------------------------------------------------

-- Función para registrar cambios importantes en el historial de la OT
CREATE OR REPLACE FUNCTION public.fn_ot_historial_on_change()
RETURNS trigger AS $$
BEGIN
  -- Evento de creación de la OT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ot_historial (ot_id, evento, detalle, actor)
    VALUES (NEW.id, 'creacion', 'OT creada con estado: ' || NEW.estado, auth.uid());
  
  -- Eventos en actualización
  ELSIF TG_OP = 'UPDATE' THEN
    -- Cambio de estado
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
      INSERT INTO public.ot_historial (ot_id, evento, detalle, actor)
      VALUES (NEW.id, 'estado', OLD.estado || ' -> ' || NEW.estado, auth.uid());
    END IF;
    -- Cambio de técnico asignado
    IF NEW.tecnico_id IS DISTINCT FROM OLD.tecnico_id THEN
      INSERT INTO public.ot_historial (ot_id, evento, detalle, actor)
      VALUES (NEW.id, 'asignacion_tecnico', COALESCE(OLD.tecnico_id::text, 'Ninguno') || ' -> ' || COALESCE(NEW.tecnico_id::text, 'Ninguno'), auth.uid());
    END IF;
    -- Cambio de prioridad
    IF NEW.prioridad IS DISTINCT FROM OLD.prioridad THEN
      INSERT INTO public.ot_historial (ot_id, evento, detalle, actor)
      VALUES (NEW.id, 'prioridad', OLD.prioridad::text || ' -> ' || NEW.prioridad::text, auth.uid());
    END IF;
  END IF;
  
  RETURN NULL; -- El resultado es ignorado para triggers AFTER
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER para poder acceder a auth.uid()
RAISE NOTICE 'Función fn_ot_historial_on_change creada o actualizada.';

-- Triggers para registrar el historial automáticamente
DROP TRIGGER IF EXISTS trg_ot_after_insert ON public.ot;
CREATE TRIGGER trg_ot_after_insert
  AFTER INSERT ON public.ot
  FOR EACH ROW EXECUTE FUNCTION public.fn_ot_historial_on_change();
RAISE NOTICE 'Trigger trg_ot_after_insert configurado en public.ot.';

DROP TRIGGER IF EXISTS trg_ot_after_update ON public.ot;
CREATE TRIGGER trg_ot_after_update
  AFTER UPDATE ON public.ot
  FOR EACH ROW EXECUTE FUNCTION public.fn_ot_historial_on_change();
RAISE NOTICE 'Trigger trg_ot_after_update configurado en public.ot.';

-- 6) VISTAS DE APOYO
--------------------------------------------------------------------------------

-- Vista con detalles completos de la OT para consultas frecuentes
CREATE OR REPLACE VIEW public.v_ot_detalle AS
SELECT
  ot.id,
  ot.ot_code,
  ot.estado,
  ot.prioridad,
  ot.canal,
  ot.fecha_recepcion,
  ot.fecha_cita,
  ot.diagnostico_preliminar,
  ot.observaciones,
  ot.turno_fecha,
  ot.turno_pos,
  c.id AS cliente_id,
  c.full_name AS cliente_nombre,
  c.email AS cliente_email,
  c.phone AS cliente_telefono,
  eq.id AS equipo_id,
  eq.tipo_equipo_slug,
  eq.marca_slug,
  eq.modelo_slug,
  eq.serial,
  u.id AS tecnico_id,
  u.raw_user_meta_data->>'email' AS tecnico_email,
  u.raw_user_meta_data->>'full_name' AS tecnico_nombre
FROM public.ot
JOIN public.clientes c ON ot.cliente_id = c.id
JOIN public.equipos_cliente eq ON ot.equipo_id = eq.id
LEFT JOIN auth.users u ON ot.tecnico_id = u.id;
RAISE NOTICE 'Vista v_ot_detalle creada o actualizada.';

-- Vista de la cola de trabajo para el día actual
CREATE OR REPLACE VIEW public.v_ot_cola_hoy AS
SELECT *
FROM public.v_ot_detalle
WHERE turno_fecha = current_date
ORDER BY
  canal ASC,
  prioridad ASC,
  turno_pos ASC,
  fecha_recepcion ASC;
RAISE NOTICE 'Vista v_ot_cola_hoy creada o actualizada.';

-- 7) SEEDS MÍNIMOS (DATOS DE EJEMPLO)
--------------------------------------------------------------------------------

DO $$
DECLARE
  cliente_id_ejemplo uuid;
  equipo_id_ejemplo_1 uuid;
  equipo_id_ejemplo_2 uuid;
  tecnico_id_ejemplo uuid;
BEGIN
  -- Solo insertar si hay clientes y equipos para referenciar
  SELECT id INTO cliente_id_ejemplo FROM public.clientes LIMIT 1;
  SELECT id INTO tecnico_id_ejemplo FROM auth.users WHERE email LIKE '%tecnico%' LIMIT 1;
  
  IF cliente_id_ejemplo IS NOT NULL THEN
    SELECT id INTO equipo_id_ejemplo_1 FROM public.equipos_cliente WHERE cliente_id = cliente_id_ejemplo LIMIT 1;
    
    IF equipo_id_ejemplo_1 IS NOT NULL THEN
      -- Insertar OT 1 de ejemplo si no existe
      IF NOT EXISTS (SELECT 1 FROM public.ot WHERE ot_code = 'OT-2024-DEMO001') THEN
        INSERT INTO public.ot (ot_code, equipo_id, cliente_id, tecnico_id, estado, prioridad, canal, diagnostico_preliminar, observaciones)
        VALUES (
          'OT-2024-DEMO001',
          equipo_id_ejemplo_1,
          cliente_id_ejemplo,
          tecnico_id_ejemplo,
          'en_proceso',
          1,
          'taller',
          'El equipo no enciende, posible fallo en la fuente de poder.',
          'El cliente indica que hubo una sobretensión en su domicilio.'
        );
        RAISE NOTICE 'Seed: OT de ejemplo 1 insertada.';
      END IF;
    ELSE
        RAISE NOTICE 'Seed omitido: No se encontraron equipos para el cliente de ejemplo.';
    END IF;
    
    -- Insertar OT 2 de ejemplo si no existe y si hay otro equipo
    SELECT id INTO equipo_id_ejemplo_2 FROM public.equipos_cliente WHERE cliente_id = cliente_id_ejemplo AND id <> equipo_id_ejemplo_1 LIMIT 1;
    IF equipo_id_ejemplo_2 IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.ot WHERE ot_code = 'OT-2024-DEMO002') THEN
            INSERT INTO public.ot (ot_code, equipo_id, cliente_id, estado, prioridad, canal, diagnostico_preliminar, observaciones)
            VALUES (
              'OT-2024-DEMO002',
              equipo_id_ejemplo_2,
              cliente_id_ejemplo,
              'abierta',
              3,
              'domicilio',
              'Problemas de conexión a internet, la red WiFi se desconecta constantemente.',
              'Servicio a domicilio agendado.'
            );
            RAISE NOTICE 'Seed: OT de ejemplo 2 insertada.';
        END IF;
    ELSE
       RAISE NOTICE 'Seed omitido para OT 2: No se encontró un segundo equipo para el cliente de ejemplo.';
    END IF;

  ELSE
    RAISE NOTICE 'Seed omitido: No hay clientes en la base de datos para crear OTs de ejemplo.';
    COMMENT ON TABLE public.ot IS 'No se insertaron OTs de ejemplo porque no existen clientes o equipos base. Ejecute los seeds de clientes/equipos primero.';
  END IF;

END $$;

-- 8) COMMENTS (Documentación en la BD)
--------------------------------------------------------------------------------
COMMENT ON TABLE public.ot IS 'Tabla principal para almacenar las Órdenes de Trabajo (OT) del taller.';
COMMENT ON COLUMN public.ot.estado IS 'Estado actual del ciclo de vida de la OT: abierta, en_proceso, en_espera, esperando_cliente, cerrada, garantia.';
COMMENT ON COLUMN public.ot.prioridad IS 'Nivel de urgencia de la OT, donde 1 es la más alta y 5 la más baja.';
COMMENT ON COLUMN public.ot.canal IS 'Canal de ingreso o servicio de la OT: taller (el cliente trae el equipo) o domicilio (el técnico va al lugar).';
COMMENT ON COLUMN public.ot.turno_fecha IS 'Día asignado en la cola de trabajo.';
COMMENT ON COLUMN public.ot.turno_pos IS 'Posición en la cola de trabajo para un día y canal específicos.';


COMMIT;

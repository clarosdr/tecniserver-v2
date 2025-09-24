-- supabase/sql/08_mantenimientos_modelo.sql
-- SECCIÓN 5 — Módulo de Mantenimientos Programados
-- Crea el modelo de datos para la gestión y notificación de mantenimientos preventivos.
-- Idempotente: Se puede ejecutar varias veces sin causar errores.

BEGIN;

--------------------------------------------------------------------------------
-- 1) TABLAS BASE
--------------------------------------------------------------------------------
DO $$
BEGIN
    -- Tabla para registrar los mantenimientos programados para cada equipo de cliente.
    CREATE TABLE IF NOT EXISTS public.mantenimientos_programados (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        -- CORRECCIÓN: Referencia a la tabla correcta de equipos, no a una genérica.
        equipo_id uuid NOT NULL REFERENCES public.equipos_cliente(id) ON DELETE RESTRICT,
        cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
        tipo text NOT NULL,                       -- ej: "mantenimiento preventivo", "limpieza", "cambio insumos"
        descripcion text,
        periodicidad_meses int NULL CHECK (periodicidad_meses >= 1), -- opcional: para reprogramación automática
        remind_days_before int NOT NULL DEFAULT 7 CHECK (remind_days_before BETWEEN 0 AND 60),
        canal text NOT NULL DEFAULT 'email' CHECK (canal IN ('email','sms','push','whatsapp')),
        fecha_programada date NOT NULL,
        fecha_recordatorio date NULL,             -- se calcula como fecha_programada - remind_days_before
        estado text NOT NULL DEFAULT 'pendiente'  -- 'pendiente','programado','enviado','confirmado','completado','reprogramado','cancelado'
          CHECK (estado IN ('pendiente','programado','enviado','confirmado','completado','reprogramado','cancelado')),
        programado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Tabla public.mantenimientos_programados creada o ya existente.';

    -- Tabla para encolar notificaciones que serán procesadas por un sistema externo (ej. Cloud Function).
    CREATE TABLE IF NOT EXISTS public.notifications_outbox (
        id bigserial PRIMARY KEY,
        mantenimiento_id uuid NOT NULL REFERENCES public.mantenimientos_programados(id) ON DELETE CASCADE,
        canal text NOT NULL,                       -- 'email','sms','push','whatsapp'
        payload jsonb NOT NULL,                    -- datos para la integración externa
        enqueued_at timestamptz DEFAULT now(),
        processed_at timestamptz NULL,
        -- Evita duplicados por si el job se ejecuta varias veces el mismo día para el mismo mantenimiento
        UNIQUE (mantenimiento_id, canal, enqueued_at)
    );
    RAISE NOTICE 'Tabla public.notifications_outbox creada o ya existente.';

    -- Crear índices para mejorar el rendimiento de las consultas
    CREATE INDEX IF NOT EXISTS idx_mant_equipo ON public.mantenimientos_programados(equipo_id);
    CREATE INDEX IF NOT EXISTS idx_mant_cliente ON public.mantenimientos_programados(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_mant_estado ON public.mantenimientos_programados(estado);
    CREATE INDEX IF NOT EXISTS idx_mant_fprog ON public.mantenimientos_programados(fecha_programada);
    CREATE INDEX IF NOT EXISTS idx_mant_frec ON public.mantenimientos_programados(fecha_recordatorio);
    RAISE NOTICE 'Índices para public.mantenimientos_programados creados o ya existentes.';
END $$;


--------------------------------------------------------------------------------
-- 2) FUNCIONES Y TRIGGERS PARA CÁLCULO DE FECHAS
--------------------------------------------------------------------------------
-- Helper para restar días de una fecha.
CREATE OR REPLACE FUNCTION public.fn_date_sub_days(_d date, _days int)
RETURNS date LANGUAGE sql IMMUTABLE AS $$
  SELECT (_d - make_interval(days => _days))::date
$$;
RAISE NOTICE 'Función fn_date_sub_days creada o actualizada.';

-- Trigger para calcular automáticamente la fecha del recordatorio.
CREATE OR REPLACE FUNCTION public.fn_set_fecha_recordatorio()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.fecha_programada IS NOT NULL AND NEW.remind_days_before IS NOT NULL THEN
    NEW.fecha_recordatorio := public.fn_date_sub_days(NEW.fecha_programada, NEW.remind_days_before);
  END IF;
  RETURN NEW;
END;
$$;
RAISE NOTICE 'Función fn_set_fecha_recordatorio creada o actualizada.';

-- Aplicar el trigger a la tabla de mantenimientos.
DROP TRIGGER IF EXISTS trg_set_fecha_recordatorio ON public.mantenimientos_programados;
CREATE TRIGGER trg_set_fecha_recordatorio
  BEFORE INSERT OR UPDATE ON public.mantenimientos_programados
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_fecha_recordatorio();
RAISE NOTICE 'Trigger trg_set_fecha_recordatorio configurado en public.mantenimientos_programados.';


--------------------------------------------------------------------------------
-- 3) FUNCIÓN PARA ENCOLAR RECORDATORIOS (PARA JOB EXTERNO)
--------------------------------------------------------------------------------
-- Esta función busca mantenimientos cuyo recordatorio debe enviarse hoy o antes
-- y los agrega a la tabla `notifications_outbox` para ser procesados.
CREATE OR REPLACE FUNCTION public.fn_enqueue_due_reminders(_now timestamptz DEFAULT now())
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  _count int := 0;
BEGIN
  -- Encola recordatorios que están en estado 'pendiente' o 'programado'
  -- y cuya fecha de recordatorio es hoy o ya pasó.
  INSERT INTO public.notifications_outbox (mantenimiento_id, canal, payload)
  SELECT
    m.id,
    m.canal,
    jsonb_build_object(
      'mantenimiento_id', m.id,
      'cliente_id', m.cliente_id,
      'equipo_id', m.equipo_id,
      'tipo', m.tipo,
      'descripcion', m.descripcion,
      'fecha_programada', m.fecha_programada,
      'fecha_recordatorio', m.fecha_recordatorio,
      'canal', m.canal
    )
  FROM public.mantenimientos_programados m
  WHERE m.estado IN ('pendiente','programado')
    AND m.fecha_recordatorio IS NOT NULL
    AND m.fecha_recordatorio <= (_now AT TIME ZONE 'utc')::date
    -- Y que no tengan ya una notificación sin procesar encolada hoy
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications_outbox o
      WHERE o.mantenimiento_id = m.id
        AND o.processed_at IS NULL
        AND o.enqueued_at::date = (_now AT TIME ZONE 'utc')::date
    );

  GET DIAGNOSTICS _count = ROW_COUNT;

  IF _count > 0 THEN
    RAISE NOTICE '% recordatorios de mantenimiento encolados para envío.', _count;
  END IF;
  
  RETURN _count;
END;
$$;
RAISE NOTICE 'Función fn_enqueue_due_reminders creada o actualizada.';


--------------------------------------------------------------------------------
-- 4) REPROGRAMACIÓN AUTOMÁTICA AL COMPLETAR UN MANTENIMIENTO
--------------------------------------------------------------------------------
-- Trigger que, al marcar un mantenimiento periódico como 'completado',
-- crea automáticamente el siguiente mantenimiento programado.
CREATE OR REPLACE FUNCTION public.fn_autoschedule_next_maintenance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  _next_date date;
BEGIN
  -- Solo si se marca como 'completado' desde otro estado y tiene periodicidad definida.
  IF (NEW.estado = 'completado' AND OLD.estado IS DISTINCT FROM 'completado' AND NEW.periodicidad_meses IS NOT NULL) THEN
    _next_date := (NEW.fecha_programada + make_interval(months => NEW.periodicidad_meses))::date;

    INSERT INTO public.mantenimientos_programados(
      equipo_id, cliente_id, tipo, descripcion, periodicidad_meses,
      remind_days_before, canal, fecha_programada, programado_por, estado
    )
    VALUES (
      NEW.equipo_id, NEW.cliente_id, NEW.tipo, NEW.descripcion, NEW.periodicidad_meses,
      NEW.remind_days_before, NEW.canal, _next_date, NEW.programado_por, 'pendiente'
    );
    RAISE NOTICE 'Mantenimiento periódico completado. Siguiente cita programada para %', _next_date;
  END IF;

  RETURN NULL; -- El resultado es ignorado para triggers AFTER
END;
$$;
RAISE NOTICE 'Función fn_autoschedule_next_maintenance creada o actualizada.';

-- Aplicar el trigger a la tabla.
DROP TRIGGER IF EXISTS trg_mant_after_update ON public.mantenimientos_programados;
CREATE TRIGGER trg_mant_after_update
  AFTER UPDATE ON public.mantenimientos_programados
  FOR EACH ROW EXECUTE FUNCTION public.fn_autoschedule_next_maintenance();
RAISE NOTICE 'Trigger trg_mant_after_update configurado en public.mantenimientos_programados.';


--------------------------------------------------------------------------------
-- 5) VISTAS ÚTILES
--------------------------------------------------------------------------------
-- Vista para consultar rápidamente los mantenimientos pendientes de realizar.
CREATE OR REPLACE VIEW public.v_mantenimientos_pendientes AS
  SELECT m.*, (m.fecha_programada - current_date) AS dias_para_cita
  FROM public.mantenimientos_programados m
  WHERE m.estado IN ('pendiente','programado','enviado','confirmado')
  ORDER BY m.fecha_programada ASC;
RAISE NOTICE 'Vista v_mantenimientos_pendientes creada o actualizada.';

-- Vista para consultar mantenimientos que ya pasaron su fecha y no se han completado.
CREATE OR REPLACE VIEW public.v_mantenimientos_vencidos AS
  SELECT m.*, (current_date - m.fecha_programada) AS dias_atraso
  FROM public.mantenimientos_programados m
  WHERE m.estado IN ('pendiente','programado','enviado','confirmado')
    AND m.fecha_programada < current_date
  ORDER BY m.fecha_programada ASC;
RAISE NOTICE 'Vista v_mantenimientos_vencidos creada o actualizada.';


--------------------------------------------------------------------------------
-- 6) COMENTARIOS (DOCUMENTACIÓN EN LA BD)
--------------------------------------------------------------------------------
COMMENT ON TABLE public.mantenimientos_programados IS 'Registra y gestiona los mantenimientos preventivos y programados para los equipos de los clientes.';
COMMENT ON COLUMN public.mantenimientos_programados.periodicidad_meses IS 'Número de meses para la reprogramación automática después de completar un mantenimiento.';
COMMENT ON COLUMN public.mantenimientos_programados.remind_days_before IS 'Cuántos días antes de la fecha_programada se debe enviar un recordatorio.';
COMMENT ON COLUMN public.mantenimientos_programados.fecha_recordatorio IS 'Fecha calculada para el envío del recordatorio (fecha_programada - remind_days_before).';
COMMENT ON COLUMN public.mantenimientos_programados.estado IS 'Ciclo de vida del mantenimiento: pendiente, programado, enviado, confirmado, completado, reprogramado, cancelado.';


COMMIT;

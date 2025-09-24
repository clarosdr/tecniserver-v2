BEGIN;

-- Utiliza un bloque DO para hacer el script idempotente.
DO $$
BEGIN
    -- 1. Creación de la tabla public.print_jobs
    -- Esta tabla registrará cada vez que se genere un documento para impresión.
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'print_jobs') THEN
        CREATE TABLE public.print_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tipo TEXT NOT NULL CHECK (tipo IN ('ot', 'presupuesto', 'factura')),
            ref_id UUID NOT NULL, -- ID de la OT, Presupuesto o Venta
            template TEXT NOT NULL, -- e.g., 'ot.html', 'presupuesto.html', etc.
            payload JSONB NOT NULL, -- Snapshot de los datos usados para el render
            rendered_url TEXT NULL, -- URL si el PDF se guarda en Supabase Storage
            created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        RAISE NOTICE 'Tabla public.print_jobs creada.';
    END IF;

    -- 2. Creación de Índices
    -- Índice para buscar trabajos por tipo y referencia.
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'print_jobs' AND indexname = 'idx_print_jobs_tipo_ref_id') THEN
        CREATE INDEX idx_print_jobs_tipo_ref_id ON public.print_jobs (tipo, ref_id);
        RAISE NOTICE 'Índice idx_print_jobs_tipo_ref_id creado.';
    END IF;

    -- Índice para ordenar por fecha de creación.
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'print_jobs' AND indexname = 'idx_print_jobs_created_at') THEN
        CREATE INDEX idx_print_jobs_created_at ON public.print_jobs (created_at DESC);
        RAISE NOTICE 'Índice idx_print_jobs_created_at creado.';
    END IF;

END $$;

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad
-- Asumiendo que las funciones fn_has_role('rol') ya existen de migraciones anteriores.

-- Política para Administradores: Acceso total
DROP POLICY IF EXISTS admin_full_access ON public.print_jobs;
CREATE POLICY admin_full_access ON public.print_jobs
    FOR ALL
    USING (public.fn_has_role('admin'))
    WITH CHECK (public.fn_has_role('admin'));
COMMENT ON POLICY admin_full_access ON public.print_jobs IS 'Los administradores tienen acceso completo para leer y escribir en los registros de impresión.';

-- Política para Recepcionistas: Pueden crear y leer sus propias impresiones
DROP POLICY IF EXISTS recepcionista_insert ON public.print_jobs;
CREATE POLICY recepcionista_insert ON public.print_jobs
    FOR INSERT
    WITH CHECK (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recepcionista_insert ON public.print_jobs IS 'Los recepcionistas pueden registrar nuevos trabajos de impresión.';

DROP POLICY IF EXISTS recepcionista_read_own ON public.print_jobs;
CREATE POLICY recepcionista_read_own ON public.print_jobs
    FOR SELECT
    USING (created_by = auth.uid() AND public.fn_has_role('recepcionista'));
COMMENT ON POLICY recepcionista_read_own ON public.print_jobs IS 'Los recepcionistas pueden ver los trabajos de impresión que ellos mismos han generado.';

-- Política para Técnicos: Pueden leer sus propias impresiones (si aplica)
DROP POLICY IF EXISTS tecnico_read_own ON public.print_jobs;
CREATE POLICY tecnico_read_own ON public.print_jobs
    FOR SELECT
    USING (created_by = auth.uid() AND public.fn_has_role('tecnico'));
COMMENT ON POLICY tecnico_read_own ON public.print_jobs IS 'Los técnicos pueden ver los trabajos de impresión que ellos mismos han generado (ej. tickets de OT).';


-- 5. (Opcional) Vista de Resumen
DROP VIEW IF EXISTS public.v_print_jobs_resumen;
CREATE VIEW public.v_print_jobs_resumen AS
SELECT
    id,
    tipo,
    ref_id,
    template,
    created_at,
    created_by
FROM
    public.print_jobs;

COMMENT ON VIEW public.v_print_jobs_resumen IS 'Vista simplificada que resume los trabajos de impresión generados.';

COMMIT;

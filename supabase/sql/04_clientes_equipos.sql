-- Idempotent script for Clients and Equipment schema.
BEGIN;

DO $$
DECLARE
    hp_id INT;
    lenovo_id INT;
    acer_id INT;
    epson_id INT;
    samsung_id INT;
BEGIN
    -- 1. TABLAS
    -- Tabla para Clientes
    CREATE TABLE IF NOT EXISTS public.clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT NOT NULL,
        doc_id TEXT,
        email TEXT,
        phone TEXT,
        direccion TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes (LOWER(nombre));
    CREATE INDEX IF NOT EXISTS idx_clientes_doc_id ON public.clientes (doc_id);

    -- Tablas de Catálogo para Equipos
    CREATE TABLE IF NOT EXISTS public.tipo_equipo (
        id SERIAL PRIMARY KEY,
        nombre TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public.marcas (
        id SERIAL PRIMARY KEY,
        nombre TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public.modelos (
        id SERIAL PRIMARY KEY,
        marca_id INT NOT NULL REFERENCES public.marcas(id) ON DELETE RESTRICT,
        nombre TEXT NOT NULL,
        UNIQUE (marca_id, nombre)
    );

    -- Tabla Principal de Equipos
    CREATE TABLE IF NOT EXISTS public.equipos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        serial TEXT UNIQUE NOT NULL,
        cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
        tipo_id INT NOT NULL REFERENCES public.tipo_equipo(id) ON DELETE RESTRICT,
        marca_id INT NOT NULL REFERENCES public.marcas(id) ON DELETE RESTRICT,
        modelo_id INT NOT NULL REFERENCES public.modelos(id) ON DELETE RESTRICT,
        notas TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_equipos_cliente ON public.equipos (cliente_id);
    CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON public.equipos (tipo_id);
    CREATE INDEX IF NOT EXISTS idx_equipos_marca ON public.equipos (marca_id);
    CREATE INDEX IF NOT EXISTS idx_equipos_modelo ON public.equipos (modelo_id);

    -- 2. NORMALIZACIÓN Y PROTECCIÓN DE DATOS (FUNCIONES Y TRIGGERS)
    
    -- Función para normalizar seriales
    CREATE OR REPLACE FUNCTION public.fn_normalize_serial(_s TEXT)
    RETURNS TEXT
    LANGUAGE sql
    IMMUTABLE
    AS $$
      SELECT REGEXP_REPLACE(UPPER(TRIM(_s)), '\s+', ' ', 'g');
    $$;
    COMMENT ON FUNCTION public.fn_normalize_serial IS 'Normaliza un número de serie a mayúsculas, sin espacios extra y sin espacios al inicio/final.';

    -- Stub de fn_is_admin si no existe (para independencia del script)
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_is_admin') THEN
      CREATE OR REPLACE FUNCTION public.fn_is_admin()
      RETURNS boolean
      LANGUAGE sql STABLE AS $$ SELECT false; $$;
      COMMENT ON FUNCTION public.fn_is_admin IS 'STUB FUNCTION: Creada para permitir la ejecución independiente de este script. La función real se define en 02_rls_politicas.sql.';
    END IF;

    -- Trigger unificado para integridad de la tabla de equipos
    CREATE OR REPLACE FUNCTION public.trigger_manage_equipo_integrity()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
        -- Normalizar el serial siempre
        NEW.serial := public.fn_normalize_serial(NEW.serial);

        -- Proteger el campo serial de cambios por no-admins
        IF TG_OP = 'UPDATE' AND OLD.serial IS DISTINCT FROM NEW.serial THEN
            IF NOT public.fn_is_admin() THEN
                RAISE EXCEPTION 'No tiene permisos para modificar el número de serie de un equipo.';
            END IF;
        END IF;

        -- Validar consistencia entre marca_id y modelo_id
        IF NOT EXISTS (
            SELECT 1 FROM public.modelos
            WHERE id = NEW.modelo_id AND marca_id = NEW.marca_id
        ) THEN
            RAISE EXCEPTION 'Inconsistencia de datos: El modelo seleccionado no pertenece a la marca especificada.';
        END IF;

        RETURN NEW;
    END;
    $$;
    COMMENT ON FUNCTION public.trigger_manage_equipo_integrity IS 'Asegura la normalización del serial, protege su inmutabilidad y valida la consistencia entre marca y modelo antes de un INSERT o UPDATE en la tabla de equipos.';

    -- Creación del trigger
    DROP TRIGGER IF EXISTS trigger_equipo_integrity ON public.equipos;
    CREATE TRIGGER trigger_equipo_integrity
      BEFORE INSERT OR UPDATE ON public.equipos
      FOR EACH ROW EXECUTE FUNCTION public.trigger_manage_equipo_integrity();

    -- 3. SEED DE DATOS DE CATÁLOGO
    INSERT INTO public.tipo_equipo (nombre) VALUES
        ('Laptop'), ('PC Escritorio'), ('Impresora'), ('Celular')
    ON CONFLICT (nombre) DO NOTHING;

    INSERT INTO public.marcas (nombre) VALUES
        ('HP'), ('Lenovo'), ('Acer'), ('Epson'), ('Samsung')
    ON CONFLICT (nombre) DO NOTHING;

    -- Seed de modelos usando variables para los IDs de marca
    SELECT id INTO hp_id FROM public.marcas WHERE nombre = 'HP';
    SELECT id INTO lenovo_id FROM public.marcas WHERE nombre = 'Lenovo';
    SELECT id INTO acer_id FROM public.marcas WHERE nombre = 'Acer';
    SELECT id INTO epson_id FROM public.marcas WHERE nombre = 'Epson';
    SELECT id INTO samsung_id FROM public.marcas WHERE nombre = 'Samsung';

    IF hp_id IS NOT NULL THEN
        INSERT INTO public.modelos (marca_id, nombre) VALUES
            (hp_id, 'Pavilion 15'), (hp_id, 'ProDesk 400 G9')
        ON CONFLICT (marca_id, nombre) DO NOTHING;
    END IF;
    IF lenovo_id IS NOT NULL THEN
        INSERT INTO public.modelos (marca_id, nombre) VALUES
            (lenovo_id, 'ThinkPad T480'), (lenovo_id, 'IdeaPad Gaming 3')
        ON CONFLICT (marca_id, nombre) DO NOTHING;
    END IF;
    IF acer_id IS NOT NULL THEN
        INSERT INTO public.modelos (marca_id, nombre) VALUES
            (acer_id, 'Aspire 5'), (acer_id, 'Nitro 5')
        ON CONFLICT (marca_id, nombre) DO NOTHING;
    END IF;
    IF epson_id IS NOT NULL THEN
        INSERT INTO public.modelos (marca_id, nombre) VALUES
            (epson_id, 'L3250'), (epson_id, 'L3110')
        ON CONFLICT (marca_id, nombre) DO NOTHING;
    END IF;
    IF samsung_id IS NOT NULL THEN
        INSERT INTO public.modelos (marca_id, nombre) VALUES
            (samsung_id, 'Galaxy S23'), (samsung_id, 'Galaxy Tab S8')
        ON CONFLICT (marca_id, nombre) DO NOTHING;
    END IF;
    
    -- 4. DOCUMENTACIÓN (COMENTARIOS)
    COMMENT ON COLUMN public.equipos.serial IS 'Número de serie único del equipo. Es normalizado (mayúsculas, sin espacios extra) y no puede ser modificado por usuarios no-administradores después de su creación.';
    COMMENT ON COLUMN public.equipos.cliente_id IS 'Referencia al cliente propietario del equipo. Protegido con ON DELETE RESTRICT para evitar borrar clientes con equipos registrados.';
    COMMENT ON COLUMN public.equipos.modelo_id IS 'Referencia al modelo específico del equipo. Un trigger asegura que el modelo corresponda a la marca (marca_id) seleccionada.';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during 04_clientes_equipos script execution: %', SQLERRM;
END $$;

COMMIT;

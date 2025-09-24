BEGIN;

-- Utiliza un bloque DO para hacer el script idempotente.
DO $$
BEGIN
    -- 1. Creación de la tabla de Clientes
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clientes') THEN
        CREATE TABLE public.clientes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            address TEXT,
            fiscal_id TEXT UNIQUE NOT NULL,
            client_category TEXT NOT NULL DEFAULT 'Individual' CHECK (client_category IN ('Individual', 'Empresa', 'Preferencial', 'Empresa Plus', 'Seleccional')),
            communication_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        RAISE NOTICE 'Tabla public.clientes creada.';
    END IF;

    -- 2. Creación de Catálogos para Equipos
    -- Tipo de Equipo
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'catalogo_tipo_equipo') THEN
        CREATE TABLE public.catalogo_tipo_equipo (
            slug TEXT PRIMARY KEY,
            nombre TEXT NOT NULL
        );
        INSERT INTO public.catalogo_tipo_equipo (slug, nombre) VALUES
            ('laptop', 'Laptop'),
            ('desktop', 'PC de Escritorio'),
            ('impresora', 'Impresora'),
            ('smartphone', 'Smartphone'),
            ('tablet', 'Tablet'),
            ('monitor', 'Monitor'),
            ('otro', 'Otro');
        RAISE NOTICE 'Tabla public.catalogo_tipo_equipo creada y poblada.';
    END IF;

    -- Marcas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'catalogo_marcas') THEN
        CREATE TABLE public.catalogo_marcas (
            slug TEXT PRIMARY KEY,
            nombre TEXT NOT NULL
        );
        INSERT INTO public.catalogo_marcas (slug, nombre) VALUES
            ('hp', 'HP'), ('dell', 'Dell'), ('lenovo', 'Lenovo'), ('apple', 'Apple'),
            ('samsung', 'Samsung'), ('asus', 'ASUS'), ('acer', 'Acer'), ('epson', 'Epson'),
            ('canon', 'Canon'), ('sony', 'Sony'), ('lg', 'LG'), ('otro', 'Otra');
        RAISE NOTICE 'Tabla public.catalogo_marcas creada y poblada.';
    END IF;

    -- Modelos (vinculados a Marcas)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'catalogo_modelos') THEN
        CREATE TABLE public.catalogo_modelos (
            slug TEXT PRIMARY KEY,
            marca_slug TEXT NOT NULL REFERENCES public.catalogo_marcas(slug) ON DELETE CASCADE,
            nombre TEXT NOT NULL
        );
        INSERT INTO public.catalogo_modelos (slug, marca_slug, nombre) VALUES
            ('pavilion', 'hp', 'Pavilion'), ('spectre', 'hp', 'Spectre'),
            ('xps', 'dell', 'XPS'), ('inspiron', 'dell', 'Inspiron'),
            ('thinkpad', 'lenovo', 'ThinkPad'), ('ideapad', 'lenovo', 'IdeaPad'),
            ('macbook-pro', 'apple', 'MacBook Pro'), ('iphone', 'apple', 'iPhone'),
            ('otro', 'otro', 'Otro');
        RAISE NOTICE 'Tabla public.catalogo_modelos creada y poblada.';
    END IF;

    -- 3. Creación de la tabla de Equipos del Cliente
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'equipos_cliente') THEN
        CREATE TABLE public.equipos_cliente (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
            tipo_equipo_slug TEXT NOT NULL REFERENCES public.catalogo_tipo_equipo(slug),
            marca_slug TEXT NOT NULL REFERENCES public.catalogo_marcas(slug),
            modelo_slug TEXT NOT NULL REFERENCES public.catalogo_modelos(slug),
            serial TEXT,
            serial_normalizado TEXT, -- Para búsquedas consistentes, inmutable para no-admins
            observations TEXT,
            location TEXT,
            registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_equipo_serial UNIQUE (serial_normalizado)
        );
        CREATE INDEX idx_equipos_cliente_cliente_id ON public.equipos_cliente(cliente_id);
        CREATE INDEX idx_equipos_cliente_serial_normalizado ON public.equipos_cliente(serial_normalizado);
        RAISE NOTICE 'Tabla public.equipos_cliente creada.';
    END IF;
END $$;

-- 4. Funciones y Triggers para la lógica de negocio de Equipos
-- Función para normalizar el serial
CREATE OR REPLACE FUNCTION public.fn_normalize_serial()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.serial IS NOT NULL THEN
        NEW.serial_normalizado := upper(regexp_replace(NEW.serial, '[^a-zA-Z0-9]', '', 'g'));
    ELSE
        NEW.serial_normalizado := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.fn_normalize_serial() IS 'Normaliza el número de serie antes de insertar/actualizar: a mayúsculas y sin caracteres especiales.';

-- Trigger que ejecuta la normalización
DROP TRIGGER IF EXISTS trg_set_serial_normalizado ON public.equipos_cliente;
CREATE TRIGGER trg_set_serial_normalizado
BEFORE INSERT OR UPDATE ON public.equipos_cliente
FOR EACH ROW EXECUTE FUNCTION public.fn_normalize_serial();

-- Función para prevenir que no-admins modifiquen el serial de un equipo ya creado
CREATE OR REPLACE FUNCTION public.fn_check_serial_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Permite la actualización si el serial antiguo era NULL o si el usuario es admin
    IF OLD.serial_normalizado IS NULL OR public.fn_has_role('admin') THEN
        RETURN NEW;
    END IF;

    -- Bloquea la actualización si el serial normalizado está cambiando
    IF NEW.serial_normalizado IS DISTINCT FROM OLD.serial_normalizado THEN
        RAISE EXCEPTION 'No tiene permisos para modificar el número de serie de un equipo existente.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.fn_check_serial_update() IS 'Impide que usuarios no administradores modifiquen el número de serie de un equipo que ya ha sido registrado.';

-- Trigger que ejecuta la verificación de modificación de serial
DROP TRIGGER IF EXISTS trg_prevent_serial_update ON public.equipos_cliente;
CREATE TRIGGER trg_prevent_serial_update
BEFORE UPDATE ON public.equipos_cliente
FOR EACH ROW EXECUTE FUNCTION public.fn_check_serial_update();

-- Trigger para manejar la fecha de actualización en clientes
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON public.clientes;
CREATE TRIGGER trg_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

COMMIT;

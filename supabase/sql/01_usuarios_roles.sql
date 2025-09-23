-- Idempotent script for user profiles, roles, and synchronization.
BEGIN;

DO $$
BEGIN
    -- 1. CATÁLOGO DE ROLES
    -- Define los roles disponibles en toda la aplicación.
    CREATE TABLE IF NOT EXISTS public.roles (
        slug TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
    );
    COMMENT ON TABLE public.roles IS 'Catálogo de roles para asignación de permisos.';

    -- Seed de roles base (idempotente)
    INSERT INTO public.roles (slug, name, description) VALUES
        ('admin', 'Administrador', 'Acceso total y sin restricciones al sistema.'),
        ('tecnico', 'Técnico de Taller', 'Puede gestionar órdenes de trabajo, inventario y ver clientes.'),
        ('recepcionista', 'Recepcionista', 'Puede crear órdenes de trabajo y gestionar clientes.'),
        ('cliente', 'Cliente Individual', 'Acceso al portal de clientes para ver sus equipos y servicios.'),
        ('empresa', 'Cliente Empresarial', 'Acceso al portal con funcionalidades extendidas para empresas.')
    ON CONFLICT (slug) DO NOTHING;

    -- 2. TABLA DE PERFILES DE USUARIO
    -- Extiende la tabla `auth.users` con metadatos públicos.
    CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'cliente' NOT NULL REFERENCES public.roles(slug)
    );
    COMMENT ON TABLE public.users IS 'Perfiles de usuario que extienden la información de auth.users.';
    COMMENT ON COLUMN public.users.role IS 'Rol por defecto para compatibilidad, aunque se prioriza la tabla user_roles.';

    -- 3. TABLA DE ASIGNACIÓN DE ROLES (MUCHOS A MUCHOS)
    -- Permite que un usuario pueda tener múltiples roles.
    CREATE TABLE IF NOT EXISTS public.user_roles (
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role_slug TEXT NOT NULL REFERENCES public.roles(slug) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_slug)
    );
    COMMENT ON TABLE public.user_roles IS 'Asigna uno o más roles a un usuario.';
    
    -- Índices para mejorar el rendimiento de las consultas de roles
    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_roles_role_slug ON public.user_roles(role_slug);


    -- 4. FUNCIÓN TRIGGER PARA SINCRONIZACIÓN AUTOMÁTICA
    -- Se ejecuta cada vez que un nuevo usuario se registra en Supabase Auth.
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      -- Inserta una nueva fila en `public.users` con los datos del nuevo usuario.
      INSERT INTO public.users (id, email, phone, full_name, avatar_url)
      VALUES (
        NEW.id,
        NEW.email,
        NEW.phone,
        NEW.raw_user_meta_data->>'full_name', -- Intenta obtener el nombre desde los metadatos
        NEW.raw_user_meta_data->>'avatar_url' -- Intenta obtener el avatar desde los metadatos
      );
      
      -- Opcional: Asignar un rol por defecto en la tabla `user_roles` también.
      -- Si el nuevo usuario no tiene rol específico en metadatos, se le asigna 'cliente'.
      INSERT INTO public.user_roles (user_id, role_slug)
      VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::text, 'cliente'))
      ON CONFLICT (user_id, role_slug) DO NOTHING;

      RETURN NEW;
    END;
    $$;
    COMMENT ON FUNCTION public.handle_new_user IS 'Crea un perfil de usuario en public.users al registrarse un nuevo usuario en auth.users.';

    -- 5. CREACIÓN DEL TRIGGER
    -- Vincula la función `handle_new_user` al evento de inserción en `auth.users`.
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during user/roles script execution: %', SQLERRM;
    -- No hacer ROLLBACK para permitir ejecuciones parciales si es idempotente
END $$;

COMMIT;

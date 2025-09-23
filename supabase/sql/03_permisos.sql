-- Idempotent script for granular permissions system.
BEGIN;

DO $$
BEGIN
    -- 1. TABLAS
    -- Tabla para definir todos los permisos disponibles en el sistema
    CREATE TABLE IF NOT EXISTS public.permissions (
        slug TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT
    );
    COMMENT ON TABLE public.permissions IS 'Catálogo de todos los permisos granulares disponibles en la aplicación.';
    COMMENT ON COLUMN public.permissions.slug IS 'Identificador único del permiso (ej: "usuarios.read").';
    COMMENT ON COLUMN public.permissions.category IS 'Agrupación lógica de permisos (ej: "usuarios", "ot").';

    -- Tabla de enlace entre roles y permisos
    CREATE TABLE IF NOT EXISTS public.role_permissions (
        role_slug TEXT NOT NULL REFERENCES public.roles(slug) ON DELETE CASCADE,
        permission_slug TEXT NOT NULL REFERENCES public.permissions(slug) ON DELETE CASCADE,
        PRIMARY KEY (role_slug, permission_slug)
    );
    COMMENT ON TABLE public.role_permissions IS 'Asigna permisos específicos a cada rol.';

    -- 2. SEEDS DE PERMISOS
    -- Usar INSERT ... ON CONFLICT para idempotencia
    INSERT INTO public.permissions (slug, name, category, description) VALUES
        ('usuarios.read', 'Leer Usuarios', 'Usuarios', 'Permite ver la lista y detalles de usuarios.'),
        ('usuarios.update_self', 'Actualizar Propio Perfil', 'Usuarios', 'Permite a un usuario editar su propia información.'),
        ('roles.assign', 'Asignar Roles', 'Roles', 'Permite asignar y revocar roles a los usuarios.'),
        ('roles.read', 'Leer Roles', 'Roles', 'Permite ver la lista de roles y sus permisos.'),
        ('clientes.read', 'Leer Clientes', 'Clientes', 'Permite ver la lista y detalles de clientes.'),
        ('clientes.write', 'Escribir Clientes', 'Clientes', 'Permite crear y editar clientes.'),
        ('equipos.read', 'Leer Equipos', 'Equipos', 'Permite ver los equipos registrados de los clientes.'),
        ('equipos.write', 'Escribir Equipos', 'Equipos', 'Permite registrar y editar equipos de clientes.'),
        ('ot.read', 'Leer Órdenes de Trabajo', 'OT', 'Permite ver todas las órdenes de trabajo.'),
        ('ot.write', 'Escribir Órdenes de Trabajo', 'OT', 'Permite crear y editar órdenes de trabajo.'),
        ('ot.historial.write', 'Escribir en Historial OT', 'OT', 'Permite añadir notas y diagnósticos al historial de una OT.'),
        ('inventario.read', 'Leer Inventario', 'Inventario', 'Permite ver el stock de productos e insumos.')
    ON CONFLICT (slug) DO NOTHING;

    -- 3. ASIGNACIÓN DE PERMISOS POR DEFECTO
    -- Admin
    INSERT INTO public.role_permissions (role_slug, permission_slug)
    SELECT 'admin', slug FROM public.permissions ON CONFLICT DO NOTHING;

    -- Recepcionista
    INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
        ('recepcionista', 'usuarios.read'),
        ('recepcionista', 'clientes.read'),
        ('recepcionista', 'clientes.write'),
        ('recepcionista', 'ot.read'),
        ('recepcionista', 'ot.write')
    ON CONFLICT DO NOTHING;

    -- Tecnico
    INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
        ('tecnico', 'usuarios.read'),
        ('tecnico', 'ot.read'),
        ('tecnico', 'ot.write'),
        ('tecnico', 'ot.historial.write'),
        ('tecnico', 'equipos.read')
    ON CONFLICT DO NOTHING;
    
    -- Empresa
    INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
        ('empresa', 'usuarios.read')
    ON CONFLICT DO NOTHING;
    
    -- Cliente
    INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
        ('cliente', 'usuarios.update_self')
    ON CONFLICT DO NOTHING;


    -- 4. VISTA DE CONVENIENCIA
    CREATE OR REPLACE VIEW public.v_effective_permissions AS
    SELECT
        ur.user_id,
        rp.permission_slug
    FROM
        public.v_user_roles ur -- Usamos la vista que ya consolida roles
    JOIN
        public.role_permissions rp ON ur.role_slug = rp.role_slug
    GROUP BY
        ur.user_id,
        rp.permission_slug;
    
    COMMENT ON VIEW public.v_effective_permissions IS 'Muestra todos los permisos efectivos que un usuario tiene, derivados de todos sus roles asignados.';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during permissions script execution: %', SQLERRM;
END $$;

COMMIT;

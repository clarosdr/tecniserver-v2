-- Idempotent RLS script for Clients and Equipment.
BEGIN;

DO $$
BEGIN
    -- 1. ASEGURAR HELPERS DE ROLES Y PERMISOS
    -- Estas funciones y vistas son cruciales para escribir políticas RLS limpias.
    -- Se usan CREATE OR REPLACE para asegurar que siempre estén actualizadas y disponibles.

    -- VISTA: Obtiene todos los roles de un usuario, incluyendo el por defecto
    CREATE OR REPLACE VIEW public.v_user_roles AS
    SELECT
        u.id as user_id,
        COALESCE(ur.role_slug, u.role) as role_slug
    FROM
        public.users u
    LEFT JOIN
        public.user_roles ur ON u.id = ur.user_id;
    COMMENT ON VIEW public.v_user_roles IS 'Consolida los roles de un usuario desde user_roles y el rol por defecto en la tabla users.';

    -- FUNCIÓN: Verifica si el usuario actual tiene un rol específico.
    CREATE OR REPLACE FUNCTION public.fn_has_role(_role_slug TEXT)
    RETURNS BOOLEAN
    LANGUAGE sql
    STABLE SECURITY DEFINER SET search_path = public
    AS $$
      SELECT EXISTS (
        SELECT 1 FROM v_user_roles
        WHERE user_id = auth.uid() AND role_slug = _role_slug
      );
    $$;
    COMMENT ON FUNCTION public.fn_has_role IS 'Devuelve true si el usuario autenticado tiene el rol especificado.';

    -- FUNCIÓN: Helper específico para administradores, de uso común.
    CREATE OR REPLACE FUNCTION public.fn_is_admin()
    RETURNS BOOLEAN
    LANGUAGE sql
    STABLE SECURITY DEFINER SET search_path = public
    AS $$
      SELECT public.fn_has_role('admin');
    $$;
    COMMENT ON FUNCTION public.fn_is_admin IS 'Devuelve true si el usuario autenticado es un administrador.';

    -- VISTAS DE CONVENIENCIA (opcionales pero recomendadas para RLS)
    CREATE OR REPLACE VIEW public.v_is_admin AS SELECT user_id, role_slug='admin' AS is_admin FROM public.v_user_roles WHERE role_slug='admin';
    CREATE OR REPLACE VIEW public.v_is_tecnico AS SELECT user_id, role_slug='tecnico' AS is_tecnico FROM public.v_user_roles WHERE role_slug='tecnico';
    CREATE OR REPLACE VIEW public.v_is_recepcionista AS SELECT user_id, role_slug='recepcionista' AS is_recepcionista FROM public.v_user_roles WHERE role_slug='recepcionista';
    CREATE OR REPLACE VIEW public.v_is_cliente AS SELECT user_id, role_slug='cliente' AS is_cliente FROM public.v_user_roles WHERE role_slug='cliente';
    CREATE OR REPLACE VIEW public.v_is_empresa AS SELECT user_id, role_slug='empresa' AS is_empresa FROM public.v_user_roles WHERE role_slug='empresa';

    -- 2. HABILITAR RLS EN LAS TABLAS
    ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.clientes FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.equipos FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.tipo_equipo ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tipo_equipo FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.marcas FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.modelos FORCE ROW LEVEL SECURITY;


    -- 3. POLÍTICAS DE SEGURIDAD

    -- 3.1 POLÍTICAS PARA public.clientes
    DROP POLICY IF EXISTS admin_full_access ON public.clientes;
    CREATE POLICY admin_full_access ON public.clientes
        FOR ALL
        USING (public.fn_is_admin())
        WITH CHECK (public.fn_is_admin());
    COMMENT ON POLICY admin_full_access ON public.clientes IS 'Los administradores tienen acceso total a todos los clientes.';

    DROP POLICY IF EXISTS recep_crud ON public.clientes;
    CREATE POLICY recep_crud ON public.clientes
        FOR SELECT, INSERT, UPDATE
        USING (public.fn_has_role('recepcionista'))
        WITH CHECK (public.fn_has_role('recepcionista'));
    COMMENT ON POLICY recep_crud ON public.clientes IS 'Los recepcionistas pueden crear, leer y actualizar clientes, pero no eliminarlos.';

    DROP POLICY IF EXISTS tecnico_read ON public.clientes;
    CREATE POLICY tecnico_read ON public.clientes
        FOR SELECT
        USING (public.fn_has_role('tecnico'));
    COMMENT ON POLICY tecnico_read ON public.clientes IS 'Los técnicos pueden ver la información de los clientes para asociarlos a órdenes de trabajo.';
    
    DROP POLICY IF EXISTS empresa_read ON public.clientes;
    CREATE POLICY empresa_read ON public.clientes
        FOR SELECT
        USING (public.fn_has_role('empresa'));
    COMMENT ON POLICY empresa_read ON public.clientes IS 'Las empresas pueden ver la lista de clientes (política base, se refinará).';

    -- TODO: Implementar cuando exista el portal de cliente
    -- DROP POLICY IF EXISTS cliente_self_read_update ON public.clientes;
    -- CREATE POLICY cliente_self_read_update ON public.clientes
    --     FOR SELECT, UPDATE
    --     USING (auth.uid() = id)
    --     WITH CHECK (auth.uid() = id);
    -- COMMENT ON POLICY cliente_self_read_update ON public.clientes IS 'Un cliente puede ver y actualizar su propia información.';


    -- 3.2 POLÍTICAS PARA public.equipos
    DROP POLICY IF EXISTS admin_full_access ON public.equipos;
    CREATE POLICY admin_full_access ON public.equipos
        FOR ALL
        USING (public.fn_is_admin())
        WITH CHECK (public.fn_is_admin());
    COMMENT ON POLICY admin_full_access ON public.equipos IS 'Los administradores tienen acceso total a todos los equipos.';

    DROP POLICY IF EXISTS recep_crud ON public.equipos;
    CREATE POLICY recep_crud ON public.equipos
        FOR SELECT, INSERT, UPDATE
        USING (public.fn_has_role('recepcionista'))
        WITH CHECK (public.fn_has_role('recepcionista'));
    COMMENT ON POLICY recep_crud ON public.equipos IS 'Los recepcionistas pueden registrar y actualizar equipos de clientes.';

    DROP POLICY IF EXISTS tecnico_read ON public.equipos;
    CREATE POLICY tecnico_read ON public.equipos
        FOR SELECT
        USING (public.fn_has_role('tecnico'));
    COMMENT ON POLICY tecnico_read ON public.equipos IS 'Los técnicos pueden ver los equipos para diagnosticarlos y trabajar en ellos.';

    DROP POLICY IF EXISTS empresa_read ON public.equipos;
    CREATE POLICY empresa_read ON public.equipos
        FOR SELECT
        USING (public.fn_has_role('empresa'));
    COMMENT ON POLICY empresa_read ON public.equipos IS 'Las empresas pueden ver la lista de equipos (política base, se refinará).';

    -- TODO: Implementar cuando exista el portal de cliente
    -- DROP POLICY IF EXISTS cliente_read_own ON public.equipos;
    -- CREATE POLICY cliente_read_own ON public.equipos
    --     FOR SELECT
    --     USING (auth.uid() = cliente_id);
    -- COMMENT ON POLICY cliente_read_own ON public.equipos IS 'Un cliente puede ver sus propios equipos registrados.';


    -- 3.3 POLÍTICAS PARA CATÁLOGOS (tipo_equipo, marcas, modelos)
    
    -- TIPO_EQUIPO
    DROP POLICY IF EXISTS admin_full_access ON public.tipo_equipo;
    CREATE POLICY admin_full_access ON public.tipo_equipo FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
    COMMENT ON POLICY admin_full_access ON public.tipo_equipo IS 'Los administradores pueden gestionar el catálogo de tipos de equipo.';

    DROP POLICY IF EXISTS authenticated_read ON public.tipo_equipo;
    CREATE POLICY authenticated_read ON public.tipo_equipo FOR SELECT TO authenticated USING (true);
    COMMENT ON POLICY authenticated_read ON public.tipo_equipo IS 'Cualquier usuario autenticado puede leer los tipos de equipo.';
    
    -- MARCAS
    DROP POLICY IF EXISTS admin_full_access ON public.marcas;
    CREATE POLICY admin_full_access ON public.marcas FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
    COMMENT ON POLICY admin_full_access ON public.marcas IS 'Los administradores pueden gestionar el catálogo de marcas.';
    
    DROP POLICY IF EXISTS authenticated_read ON public.marcas;
    CREATE POLICY authenticated_read ON public.marcas FOR SELECT TO authenticated USING (true);
    COMMENT ON POLICY authenticated_read ON public.marcas IS 'Cualquier usuario autenticado puede leer las marcas.';

    -- MODELOS
    DROP POLICY IF EXISTS admin_full_access ON public.modelos;
    CREATE POLICY admin_full_access ON public.modelos FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
    COMMENT ON POLICY admin_full_access ON public.modelos IS 'Los administradores pueden gestionar el catálogo de modelos.';
    
    DROP POLICY IF EXISTS authenticated_read ON public.modelos;
    CREATE POLICY authenticated_read ON public.modelos FOR SELECT TO authenticated USING (true);
    COMMENT ON POLICY authenticated_read ON public.modelos IS 'Cualquier usuario autenticado puede leer los modelos.';


EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during 05_rls_clientes_equipos script execution: %', SQLERRM;
END $$;

COMMIT;

-- Idempotent script for RLS policies and helpers.
BEGIN;

DO $$ BEGIN
  -- VISTAS DE CONVENIENCIA PARA RLS
  -- Combina roles de `user_roles` y `users.role` para compatibilidad.
  CREATE OR REPLACE VIEW public.v_user_roles AS
  SELECT
    ur.user_id,
    ur.role_slug
  FROM public.user_roles ur
  UNION
  SELECT
    u.id AS user_id,
    u.role AS role_slug
  FROM public.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = u.id);

  COMMENT ON VIEW public.v_user_roles IS 'Consolida los roles de un usuario desde la tabla user_roles (múltiples) o users.role (simple, por compatibilidad).';

  CREATE OR REPLACE VIEW public.v_is_admin AS
  SELECT
    u.id AS user_id,
    EXISTS (
      SELECT 1 FROM public.v_user_roles vur WHERE vur.user_id = u.id AND vur.role_slug = 'admin'
    ) AS is_admin
  FROM public.users u;

  CREATE OR REPLACE VIEW public.v_is_tecnico AS
  SELECT
    u.id AS user_id,
    EXISTS (
      SELECT 1 FROM public.v_user_roles vur WHERE vur.user_id = u.id AND vur.role_slug = 'tecnico'
    ) AS is_tecnico
  FROM public.users u;

  CREATE OR REPLACE VIEW public.v_is_recepcionista AS
  SELECT
    u.id AS user_id,
    EXISTS (
      SELECT 1 FROM public.v_user_roles vur WHERE vur.user_id = u.id AND vur.role_slug = 'recepcionista'
    ) AS is_recepcionista
  FROM public.users u;

  CREATE OR REPLACE VIEW public.v_is_cliente AS
  SELECT
    u.id AS user_id,
    EXISTS (
      SELECT 1 FROM public.v_user_roles vur WHERE vur.user_id = u.id AND vur.role_slug = 'cliente'
    ) AS is_cliente
  FROM public.users u;

  CREATE OR REPLACE VIEW public.v_is_empresa AS
  SELECT
    u.id AS user_id,
    EXISTS (
      SELECT 1 FROM public.v_user_roles vur WHERE vur.user_id = u.id AND vur.role_slug = 'empresa'
    ) AS is_empresa
  FROM public.users u;

  -- FUNCIONES HELPERS PARA RLS
  CREATE OR REPLACE FUNCTION public.fn_has_role(_role text)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.v_user_roles
      WHERE user_id = auth.uid() AND role_slug = _role
    );
  $$;
  COMMENT ON FUNCTION public.fn_has_role IS 'Verifica si el usuario autenticado tiene un rol específico.';

  CREATE OR REPLACE FUNCTION public.fn_is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.v_is_admin
      WHERE user_id = auth.uid() AND is_admin = true
    );
  $$;
  COMMENT ON FUNCTION public.fn_is_admin IS 'Atajo para verificar si el usuario autenticado es administrador.';


  -- ACTIVACIÓN DE RLS
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

  -- POLÍTICAS RLS PARA public.users
  DROP POLICY IF EXISTS admin_full_access ON public.users;
  CREATE POLICY admin_full_access ON public.users
    FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
  COMMENT ON POLICY admin_full_access ON public.users IS 'Los administradores tienen acceso total a todos los perfiles de usuario.';

  DROP POLICY IF EXISTS self_read ON public.users;
  CREATE POLICY self_read ON public.users
    FOR SELECT
    USING (id = auth.uid());
  COMMENT ON POLICY self_read ON public.users IS 'Cada usuario puede leer su propio perfil.';
  
  DROP POLICY IF EXISTS staff_read_users ON public.users;
  CREATE POLICY staff_read_users ON public.users
    FOR SELECT
    USING (public.fn_has_role('tecnico') OR public.fn_has_role('recepcionista'));
  COMMENT ON POLICY staff_read_users ON public.users IS 'Técnicos y recepcionistas pueden ver la lista de usuarios.';


  DROP POLICY IF EXISTS self_update_profile ON public.users;
  CREATE POLICY self_update_profile ON public.users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
  COMMENT ON POLICY self_update_profile ON public.users IS 'Permite a los usuarios actualizar su propio perfil. La inmutabilidad de columnas críticas se delega a un trigger.';

  -- POLÍTICAS RLS PARA public.user_roles
  DROP POLICY IF EXISTS admin_full_access ON public.user_roles;
  CREATE POLICY admin_full_access ON public.user_roles
    FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
  COMMENT ON POLICY admin_full_access ON public.user_roles IS 'Los administradores pueden gestionar todas las asignaciones de roles.';

  DROP POLICY IF EXISTS self_read_roles ON public.user_roles;
  CREATE POLICY self_read_roles ON public.user_roles
    FOR SELECT
    USING (user_id = auth.uid());
  COMMENT ON POLICY self_read_roles ON public.user_roles IS 'Cada usuario puede ver sus propios roles asignados.';

  -- TRIGGER PARA REFORZAR LA INMUTABILIDAD DE COLUMNAS EN public.users
  CREATE OR REPLACE FUNCTION public.enforce_profile_self_update_columns()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
  BEGIN
    -- Los administradores pueden cambiar cualquier cosa.
    IF public.fn_is_admin() THEN
      RETURN NEW;
    END IF;

    -- Los usuarios no-admin tienen restricciones.
    IF OLD.email IS DISTINCT FROM NEW.email OR
       OLD.role  IS DISTINCT FROM NEW.role  OR
       OLD.id    IS DISTINCT FROM NEW.id
    THEN
      RAISE EXCEPTION 'No puedes modificar email, role o id de tu perfil.';
    END IF;
    
    RETURN NEW;
  END;
  $$;
  COMMENT ON FUNCTION public.enforce_profile_self_update_columns IS 'Impide que usuarios no-admin modifiquen columnas sensibles (email, role, id) de su propio perfil.';

  DROP TRIGGER IF EXISTS enforce_self_update_on_users ON public.users;
  CREATE TRIGGER enforce_self_update_on_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_profile_self_update_columns();
  COMMENT ON TRIGGER enforce_self_update_on_users ON public.users IS 'Ejecuta la lógica de protección de columnas antes de cualquier actualización en la tabla de usuarios.';


  -- ÍNDICES PARA MEJORAR RENDIMIENTO DE VISTAS
  CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
  CREATE INDEX IF NOT EXISTS idx_user_roles_role_slug ON public.user_roles (role_slug);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during RLS policy script execution: %', SQLERRM;
    -- No hacer ROLLBACK para permitir ejecuciones parciales si es idempotente
END $$;

COMMIT;

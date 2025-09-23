-- supabase/sql/09_rls_mantenimientos.sql
-- SECCIÓN 5.1 — Políticas de Seguridad (RLS) para Mantenimientos Programados
-- Define los permisos de acceso y modificación para el módulo de mantenimientos.
-- Idempotente: Se puede ejecutar varias veces sin causar errores.

BEGIN;

--------------------------------------------------------------------------------
-- 1) HELPERS DE ROLES Y PERMISOS (Idempotente)
--------------------------------------------------------------------------------
DO $$
BEGIN
    -- VISTA para obtener los roles de cada usuario de forma sencilla
    CREATE OR REPLACE VIEW public.v_user_roles AS
    SELECT
        u.id AS user_id,
        u.email,
        COALESCE(
            (SELECT array_agg(ur.role_slug) FROM public.user_roles ur WHERE ur.user_id = u.id),
            ARRAY[u.role] -- Fallback al rol en la tabla de usuarios
        ) AS roles
    FROM auth.users u;
    RAISE NOTICE 'Vista v_user_roles creada o actualizada.';

    -- FUNCIÓN para verificar si el usuario actual tiene un rol específico
    CREATE OR REPLACE FUNCTION public.fn_has_role(p_role TEXT)
    RETURNS BOOLEAN AS $$
    DECLARE
        user_roles TEXT[];
    BEGIN
        SELECT roles INTO user_roles FROM public.v_user_roles WHERE user_id = auth.uid();
        RETURN p_role = ANY(user_roles);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    RAISE NOTICE 'Función fn_has_role creada o actualizada.';

    -- FUNCIONES de conveniencia para roles comunes
    CREATE OR REPLACE FUNCTION public.fn_is_admin()
    RETURNS BOOLEAN AS $$
        SELECT public.fn_has_role('admin');
    $$ LANGUAGE sql SECURITY DEFINER;
    RAISE NOTICE 'Función fn_is_admin creada o actualizada.';

    -- VISTAS de conveniencia
    CREATE OR REPLACE VIEW public.v_is_admin AS SELECT auth.uid() AS user_id, public.fn_is_admin() AS is_admin;
    CREATE OR REPLACE VIEW public.v_is_tecnico AS SELECT auth.uid() AS user_id, public.fn_has_role('tecnico') AS is_tecnico;
    CREATE OR REPLACE VIEW public.v_is_recepcionista AS SELECT auth.uid() AS user_id, public.fn_has_role('recepcionista') AS is_recepcionista;
    CREATE OR REPLACE VIEW public.v_is_cliente AS SELECT auth.uid() AS user_id, public.fn_has_role('cliente') AS is_cliente;
    CREATE OR REPLACE VIEW public.v_is_empresa AS SELECT auth.uid() AS user_id, public.fn_has_role('empresa') AS is_empresa;
    RAISE NOTICE 'Vistas de roles (v_is_admin, v_is_tecnico, etc.) creadas o actualizadas.';
END $$;


--------------------------------------------------------------------------------
-- 2) HABILITACIÓN DE RLS
--------------------------------------------------------------------------------
DO $$
BEGIN
    ALTER TABLE public.mantenimientos_programados ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.notifications_outbox ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado en tablas: mantenimientos_programados, notifications_outbox.';
END $$;


--------------------------------------------------------------------------------
-- 3) POLÍTICAS EN public.mantenimientos_programados
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS admin_full_access ON public.mantenimientos_programados;
CREATE POLICY admin_full_access ON public.mantenimientos_programados FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.mantenimientos_programados IS '[Admins] Acceso total para crear, leer, actualizar y eliminar mantenimientos.';

DROP POLICY IF EXISTS recep_crud ON public.mantenimientos_programados;
CREATE POLICY recep_crud ON public.mantenimientos_programados FOR SELECT, INSERT, UPDATE
    USING (public.fn_has_role('recepcionista'))
    WITH CHECK (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recep_crud ON public.mantenimientos_programados IS '[Recepcionistas] Pueden leer, crear y actualizar mantenimientos. La eliminación está restringida por defecto.';

DROP POLICY IF EXISTS tecnico_update ON public.mantenimientos_programados;
CREATE POLICY tecnico_update ON public.mantenimientos_programados FOR UPDATE
    USING (public.fn_has_role('tecnico'))
    WITH CHECK (public.fn_has_role('tecnico'));
COMMENT ON POLICY tecnico_update ON public.mantenimientos_programados IS '[Técnicos] Pueden actualizar mantenimientos. La restricción a columnas (estado, descripción) debe ser manejada por la aplicación o un trigger.';

DROP POLICY IF EXISTS lectura_general_operativa ON public.mantenimientos_programados;
CREATE POLICY lectura_general_operativa ON public.mantenimientos_programados FOR SELECT
    USING (auth.role() = 'authenticated');
COMMENT ON POLICY lectura_general_operativa ON public.mantenimientos_programados IS '[Autenticados] Permite a todo el personal del taller leer la lista de mantenimientos programados.';

-- TODO: Cuando el portal de clientes esté integrado, se deberá agregar la siguiente política:
-- CREATE POLICY client_read_own ON public.mantenimientos_programados FOR SELECT
--     USING (
--         public.fn_has_role('cliente') AND
--         auth.uid() = (SELECT user_id FROM public.clientes WHERE id = cliente_id)
--     );
-- COMMENT ON POLICY client_read_own ON public.mantenimientos_programados IS '[Clientes] Pueden ver únicamente sus propios mantenimientos programados.';


--------------------------------------------------------------------------------
-- 4) POLÍTICAS EN public.notifications_outbox
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS admin_full_access ON public.notifications_outbox;
CREATE POLICY admin_full_access ON public.notifications_outbox FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.notifications_outbox IS '[Admins] Acceso total a la bandeja de salida de notificaciones para depuración y gestión.';

DROP POLICY IF EXISTS system_read_ops ON public.notifications_outbox;
CREATE POLICY system_read_ops ON public.notifications_outbox FOR SELECT
    USING (auth.role() = 'authenticated');
COMMENT ON POLICY system_read_ops ON public.notifications_outbox IS '[Autenticados] Permite al personal del taller y sistemas backend monitorear la cola de notificaciones.';

-- NOTA: No se crea una política de INSERT para usuarios no-admin. La inserción de notificaciones
-- se realiza exclusivamente a través de la función `fn_enqueue_due_reminders()`, que se ejecuta
-- con privilegios de definidor (SECURITY DEFINER) o por un servicio backend con rol de `service_role`.
-- Esto previene que usuarios comunes puedan inyectar notificaciones directamente.


--------------------------------------------------------------------------------
-- 5) PROCESAMIENTO DE LA BANDEJA DE SALIDA
--------------------------------------------------------------------------------
COMMENT ON TABLE public.notifications_outbox IS 'Bandeja de salida para notificaciones. Un proceso externo (ej. Supabase Edge Function o un cron job) leerá de esta tabla, enviará la notificación a través del canal correspondiente (email, SMS, etc.) y luego actualizará la columna `processed_at` para marcarla como procesada.';


COMMIT;

-- supabase/sql/07_rls_ot.sql
-- SECCIÓN 4.1 — Políticas de Seguridad (RLS) para Órdenes de Trabajo (OT)
-- Define los permisos de acceso y modificación para cada rol en el módulo de OTs.
-- Idempotente: Se puede ejecutar varias veces sin causar errores.

BEGIN;

--------------------------------------------------------------------------------
-- 1) HELPERS DE ROLES Y PERMISOS (Asegurar idempotencia)
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

    -- VISTAS y FUNCIONES de conveniencia para roles comunes
    CREATE OR REPLACE FUNCTION public.fn_is_admin()
    RETURNS BOOLEAN AS $$
        SELECT public.fn_has_role('admin');
    $$ LANGUAGE sql SECURITY DEFINER;
    RAISE NOTICE 'Función fn_is_admin creada o actualizada.';

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
    ALTER TABLE public.ot ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ot_historial ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ot_accesorios ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ot_adjuntos ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado en tablas de OT: ot, ot_historial, ot_accesorios, ot_adjuntos.';
END $$;


--------------------------------------------------------------------------------
-- 3) POLÍTICAS DE SEGURIDAD
--------------------------------------------------------------------------------

-- Tabla: public.ot
--------------------------------------------------
DROP POLICY IF EXISTS admin_full_access ON public.ot;
CREATE POLICY admin_full_access ON public.ot FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.ot IS '[Admins] Pueden realizar cualquier operación en las OTs.';

DROP POLICY IF EXISTS recep_crud ON public.ot;
CREATE POLICY recep_crud ON public.ot FOR ALL
    USING (public.fn_has_role('recepcionista'))
    WITH CHECK (
        public.fn_has_role('recepcionista') AND
        -- COMMENT: Recepcionista no puede cerrar OTs, solo el admin.
        (estado IS NULL OR estado NOT IN ('cerrada', 'garantia'))
    );
COMMENT ON POLICY recep_crud ON public.ot IS '[Recepcionistas] Pueden leer, crear y actualizar OTs, pero no eliminarlas ni cerrarlas.';

DROP POLICY IF EXISTS tecnico_update ON public.ot;
CREATE POLICY tecnico_update ON public.ot FOR UPDATE
    USING (public.fn_has_role('tecnico'))
    WITH CHECK (
        public.fn_has_role('tecnico') AND
        -- COMMENT: Un técnico solo puede actualizar OTs que tiene asignadas, o las que no tienen técnico.
        (tecnico_id IS NULL OR tecnico_id = auth.uid()) AND
        -- COMMENT: Un técnico no puede cerrar OTs.
        (estado IS NULL OR estado NOT IN ('cerrada', 'garantia'))
    );
COMMENT ON POLICY tecnico_update ON public.ot IS '[Técnicos] Pueden actualizar OTs asignadas a ellos o sin asignar, pero no cerrarlas.';

DROP POLICY IF EXISTS lectura_general_operativa ON public.ot;
CREATE POLICY lectura_general_operativa ON public.ot FOR SELECT
    USING (auth.role() = 'authenticated');
COMMENT ON POLICY lectura_general_operativa ON public.ot IS '[Autenticados] Todos los usuarios autenticados del taller pueden leer la lista de OTs. Se restringirá para clientes/empresas en el futuro.';


-- Tabla: public.ot_historial
--------------------------------------------------
DROP POLICY IF EXISTS admin_full_access ON public.ot_historial;
CREATE POLICY admin_full_access ON public.ot_historial FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.ot_historial IS '[Admins] Pueden realizar cualquier operación en el historial.';

DROP POLICY IF EXISTS write_actor ON public.ot_historial;
CREATE POLICY write_actor ON public.ot_historial FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        (actor IS NULL OR actor = auth.uid()) -- El trigger se encargará de setear el actor
    );
COMMENT ON POLICY write_actor ON public.ot_historial IS '[Autenticados] Cualquier usuario del taller puede agregar una nota al historial.';

DROP POLICY IF EXISTS read_operativa ON public.ot_historial;
CREATE POLICY read_operativa ON public.ot_historial FOR SELECT
    USING (auth.role() = 'authenticated');
COMMENT ON POLICY read_operativa ON public.ot_historial IS '[Autenticados] Todos los usuarios del taller pueden leer el historial.';


-- Tabla: public.ot_accesorios
--------------------------------------------------
DROP POLICY IF EXISTS admin_full_access ON public.ot_accesorios;
CREATE POLICY admin_full_access ON public.ot_accesorios FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.ot_accesorios IS '[Admins] Tienen acceso total a los accesorios.';

DROP POLICY IF EXISTS recep_crud ON public.ot_accesorios;
CREATE POLICY recep_crud ON public.ot_accesorios FOR ALL
    USING (public.fn_has_role('recepcionista'))
    WITH CHECK (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recep_crud ON public.ot_accesorios IS '[Recepcionistas] Pueden gestionar completamente los accesorios de una OT.';

DROP POLICY IF EXISTS tecnico_add_list ON public.ot_accesorios;
CREATE POLICY tecnico_add_list ON public.ot_accesorios FOR ALL
    USING (public.fn_has_role('tecnico'))
    WITH CHECK (public.fn_has_role('tecnico')); -- Permitimos CRUD completo al técnico por simplicidad operativa.
COMMENT ON POLICY tecnico_add_list ON public.ot_accesorios IS '[Técnicos] Pueden leer, añadir, editar y eliminar accesorios si detectan faltantes/sobrantes.';


-- Tabla: public.ot_adjuntos
--------------------------------------------------
DROP POLICY IF EXISTS admin_full_access ON public.ot_adjuntos;
CREATE POLICY admin_full_access ON public.ot_adjuntos FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.ot_adjuntos IS '[Admins] Tienen acceso total a los adjuntos.';

DROP POLICY IF EXISTS recep_crud ON public.ot_adjuntos;
CREATE POLICY recep_crud ON public.ot_adjuntos FOR ALL
    USING (public.fn_has_role('recepcionista'))
    WITH CHECK (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recep_crud ON public.ot_adjuntos IS '[Recepcionistas] Pueden gestionar adjuntos (fotos al recibir).';

DROP POLICY IF EXISTS tecnico_add ON public.ot_adjuntos;
CREATE POLICY tecnico_add ON public.ot_adjuntos FOR INSERT WITH CHECK (public.fn_has_role('tecnico'));
COMMENT ON POLICY tecnico_add ON public.ot_adjuntos IS '[Técnicos] Pueden añadir adjuntos (fotos del diagnóstico/reparación).';

DROP POLICY IF EXISTS lectura_adjuntos ON public.ot_adjuntos;
CREATE POLICY lectura_adjuntos ON public.ot_adjuntos FOR SELECT
    USING (auth.role() = 'authenticated');
COMMENT ON POLICY lectura_adjuntos ON public.ot_adjuntos IS '[Autenticados] El personal puede ver los adjuntos.';


--------------------------------------------------------------------------------
-- 4) TRIGGERS DE APOYO A RLS
--------------------------------------------------------------------------------

-- Trigger para auto-asignar el actor en el historial si no se especifica
CREATE OR REPLACE FUNCTION public.fn_set_historial_actor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actor IS NULL THEN
    NEW.actor := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_historial_actor ON public.ot_historial;
CREATE TRIGGER trg_set_historial_actor
  BEFORE INSERT ON public.ot_historial
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_historial_actor();
COMMENT ON TRIGGER trg_set_historial_actor ON public.ot_historial IS 'Asegura que cada evento del historial tenga un actor asociado.';


-- Trigger para proteger columnas clave de ser modificadas por no-admins
CREATE OR REPLACE FUNCTION public.fn_protect_ot_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo aplica la lógica si el usuario NO es admin
    IF NOT public.fn_is_admin() THEN
        -- Y si la OT ya no está en su estado inicial 'abierta'
        IF OLD.estado <> 'abierta' THEN
            IF NEW.canal IS DISTINCT FROM OLD.canal THEN
                RAISE EXCEPTION 'No se puede modificar el canal de una OT en proceso.';
            END IF;
            IF NEW.turno_fecha IS DISTINCT FROM OLD.turno_fecha THEN
                RAISE EXCEPTION 'No se puede modificar la fecha del turno de una OT en proceso.';
            END IF;
            IF NEW.turno_pos IS DISTINCT FROM OLD.turno_pos THEN
                RAISE EXCEPTION 'No se puede modificar la posición del turno de una OT en proceso.';
            END IF;
             IF NEW.cliente_id IS DISTINCT FROM OLD.cliente_id THEN
                RAISE EXCEPTION 'No se puede cambiar el cliente de una OT en proceso.';
            END IF;
             IF NEW.equipo_id IS DISTINCT FROM OLD.equipo_id THEN
                RAISE EXCEPTION 'No se puede cambiar el equipo de una OT en proceso.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_ot_columns_on_update ON public.ot;
CREATE TRIGGER trg_protect_ot_columns_on_update
  BEFORE UPDATE ON public.ot
  FOR EACH ROW EXECUTE FUNCTION public.fn_protect_ot_columns();
COMMENT ON TRIGGER trg_protect_ot_columns_on_update ON public.ot IS 'Previene que roles no-admin modifiquen campos críticos una vez la OT ha sido ingresada.';

COMMIT;

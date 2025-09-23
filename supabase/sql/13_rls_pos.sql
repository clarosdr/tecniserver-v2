-- supabase/sql/13_rls_pos.sql
-- SECCIÓN 7.1 — Políticas de Seguridad (RLS) para Punto de Venta (POS)
-- Define los permisos de acceso y modificación para el módulo de ventas.
-- Idempotente: Se puede ejecutar varias veces sin causar errores.

BEGIN;

--------------------------------------------------------------------------------
-- 1) HELPERS DE ROLES Y PERMISOS (Idempotente)
-- Re-declarados para asegurar que el script sea autocontenido y no dependa de ejecuciones previas.
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
            ARRAY[u.role]
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

    -- FUNCIÓN de conveniencia para rol de administrador
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
    ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.caja_aperturas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.notas_credito ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado en todas las tablas del módulo POS.';
END $$;


--------------------------------------------------------------------------------
-- 3) POLÍTICAS DE ACCESO
--------------------------------------------------------------------------------

-- Tabla: public.cajas
DROP POLICY IF EXISTS admin_full_access ON public.cajas;
CREATE POLICY admin_full_access ON public.cajas FOR ALL
    USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.cajas IS '[Admins] Acceso total para crear y gestionar cajas.';

DROP POLICY IF EXISTS staff_read_access ON public.cajas;
CREATE POLICY staff_read_access ON public.cajas FOR SELECT
    USING (public.fn_has_role('admin') OR public.fn_has_role('recepcionista'));
COMMENT ON POLICY staff_read_access ON public.cajas IS '[Personal de Caja] Pueden ver las cajas disponibles para abrir un turno.';

-- Tabla: public.caja_aperturas
DROP POLICY IF EXISTS admin_full_access ON public.caja_aperturas;
CREATE POLICY admin_full_access ON public.caja_aperturas FOR ALL
    USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.caja_aperturas IS '[Admins] Acceso total para gestionar todos los turnos de caja.';

DROP POLICY IF EXISTS recep_manage_own_opening ON public.caja_aperturas FOR ALL
    USING (public.fn_has_role('recepcionista') AND abierto_por = auth.uid())
    WITH CHECK (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recep_manage_own_opening ON public.caja_aperturas IS '[Recepcionistas] Pueden abrir un turno y solo pueden modificar/cerrar el turno que ellos mismos abrieron.';

DROP POLICY IF EXISTS staff_read_access ON public.caja_aperturas;
CREATE POLICY staff_read_access ON public.caja_aperturas FOR SELECT
    USING (public.fn_has_role('admin') OR public.fn_has_role('recepcionista'));
COMMENT ON POLICY staff_read_access ON public.caja_aperturas IS '[Personal de Caja] Pueden ver el historial de aperturas y cierres.';

-- Tabla: public.ventas
DROP POLICY IF EXISTS admin_full_access ON public.ventas;
CREATE POLICY admin_full_access ON public.ventas FOR ALL
    USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.ventas IS '[Admins] Acceso total a todas las ventas.';

DROP POLICY IF EXISTS recep_manage_own_sales ON public.ventas FOR INSERT, UPDATE
    USING (public.fn_has_role('recepcionista'))
    WITH CHECK (public.fn_has_role('recepcionista') AND creada_por = auth.uid());
COMMENT ON POLICY recep_manage_own_sales ON public.ventas IS '[Recepcionistas] Pueden crear nuevas ventas y modificar solo las ventas creadas por ellos.';

DROP POLICY IF EXISTS staff_read_access ON public.ventas;
CREATE POLICY staff_read_access ON public.ventas FOR SELECT
    USING (public.fn_has_role('admin') OR public.fn_has_role('recepcionista') OR public.fn_has_role('tecnico'));
COMMENT ON POLICY staff_read_access ON public.ventas IS '[Personal Interno] Pueden consultar ventas, ej. para asociar a una OT o verificar pagos.';
-- TODO: Portal Clientes - Los clientes solo podrán ver sus propias ventas (cliente_id = auth.uid())

-- Tablas: public.venta_items y public.pagos (Dependen de la venta)
DROP POLICY IF EXISTS admin_full_access ON public.venta_items;
CREATE POLICY admin_full_access ON public.venta_items FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.venta_items IS '[Admins] Acceso total a los ítems de todas las ventas.';

DROP POLICY IF EXISTS recep_manage_own_sale_items ON public.venta_items FOR ALL
    USING (
        public.fn_has_role('recepcionista') AND
        EXISTS (SELECT 1 FROM public.ventas v WHERE v.id = venta_items.venta_id AND v.creada_por = auth.uid())
    )
    WITH CHECK (
        public.fn_has_role('recepcionista') AND
        EXISTS (SELECT 1 FROM public.ventas v WHERE v.id = venta_items.venta_id AND v.creada_por = auth.uid())
    );
COMMENT ON POLICY recep_manage_own_sale_items ON public.venta_items IS '[Recepcionistas] Pueden gestionar (CRUD) los ítems solo de las ventas que ellos crearon.';

DROP POLICY IF EXISTS staff_read_access ON public.venta_items;
CREATE POLICY staff_read_access ON public.venta_items FOR SELECT
    USING (public.fn_has_role('admin') OR public.fn_has_role('recepcionista') OR public.fn_has_role('tecnico'));
COMMENT ON POLICY staff_read_access ON public.venta_items IS '[Personal Interno] Pueden ver los detalles de los ítems de las ventas.';

DROP POLICY IF EXISTS admin_full_access ON public.pagos;
CREATE POLICY admin_full_access ON public.pagos FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.pagos IS '[Admins] Acceso total a los pagos de todas las ventas.';

DROP POLICY IF EXISTS recep_manage_own_sale_payments ON public.pagos FOR ALL
    USING (
        public.fn_has_role('recepcionista') AND
        EXISTS (SELECT 1 FROM public.ventas v WHERE v.id = pagos.venta_id AND v.creada_por = auth.uid())
    )
    WITH CHECK (
        public.fn_has_role('recepcionista') AND
        EXISTS (SELECT 1 FROM public.ventas v WHERE v.id = pagos.venta_id AND v.creada_por = auth.uid())
    );
COMMENT ON POLICY recep_manage_own_sale_payments ON public.pagos IS '[Recepcionistas] Pueden gestionar (CRUD) los pagos solo de las ventas que ellos crearon.';

DROP POLICY IF EXISTS staff_read_access ON public.pagos;
CREATE POLICY staff_read_access ON public.pagos FOR SELECT
    USING (public.fn_has_role('admin') OR public.fn_has_role('recepcionista') OR public.fn_has_role('tecnico'));
COMMENT ON POLICY staff_read_access ON public.pagos IS '[Personal Interno] Pueden ver los pagos registrados.';

-- Tabla: public.notas_credito
DROP POLICY IF EXISTS admin_full_access ON public.notas_credito;
CREATE POLICY admin_full_access ON public.notas_credito FOR ALL
    USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.notas_credito IS '[Admins] Acceso total para gestionar todas las notas de crédito.';

DROP POLICY IF EXISTS recep_create_own_sale_nc ON public.notas_credito FOR INSERT
    WITH CHECK (
        public.fn_has_role('recepcionista') AND
        EXISTS (SELECT 1 FROM public.ventas v WHERE v.id = notas_credito.venta_id AND v.creada_por = auth.uid())
    );
COMMENT ON POLICY recep_create_own_sale_nc ON public.notas_credito IS '[Recepcionistas] Pueden crear notas de crédito (devoluciones) solo para las ventas que ellos mismos generaron.';

DROP POLICY IF EXISTS staff_read_access ON public.notas_credito;
CREATE POLICY staff_read_access ON public.notas_credito FOR SELECT
    USING (public.fn_has_role('admin') OR public.fn_has_role('recepcionista'));
COMMENT ON POLICY staff_read_access ON public.notas_credito IS '[Personal de Caja] Pueden consultar el historial de notas de crédito.';


COMMIT;

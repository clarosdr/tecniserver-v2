-- supabase/sql/11_rls_inventario.sql
-- SECCIÓN 6.1 — Políticas de Seguridad (RLS) para Inventario
-- Define los permisos de acceso y modificación para el módulo de inventario.
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
    ALTER TABLE public.almacenes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.producto_lotes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado en todas las tablas del módulo de inventario.';
END $$;


--------------------------------------------------------------------------------
-- 3) POLÍTICAS DE ACCESO
--------------------------------------------------------------------------------

-- Tabla: public.almacenes
DROP POLICY IF EXISTS admin_full_access ON public.almacenes;
CREATE POLICY admin_full_access ON public.almacenes FOR ALL
    USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.almacenes IS '[Admins] Acceso total a los almacenes.';

DROP POLICY IF EXISTS staff_read_access ON public.almacenes;
CREATE POLICY staff_read_access ON public.almacenes FOR SELECT
    USING (auth.role() = 'authenticated');
COMMENT ON POLICY staff_read_access ON public.almacenes IS '[Autenticados] Todo el personal puede ver la lista de almacenes.';

-- Tabla: public.productos
DROP POLICY IF EXISTS admin_full_access ON public.productos;
CREATE POLICY admin_full_access ON public.productos FOR ALL
    USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.productos IS '[Admins] Acceso total a los productos.';

DROP POLICY IF EXISTS authenticated_read_access ON public.productos;
CREATE POLICY authenticated_read_access ON public.productos FOR SELECT
    USING (auth.role() = 'authenticated');
COMMENT ON POLICY authenticated_read_access ON public.productos IS '[Autenticados] Cualquier usuario logueado (personal, cliente, empresa) puede ver el catálogo de productos.';
-- TODO: En el portal de cliente, filtrar para mostrar solo productos `activo = true`.

-- Tablas: public.producto_lotes y public.stock
DROP POLICY IF EXISTS admin_full_access ON public.producto_lotes;
CREATE POLICY admin_full_access ON public.producto_lotes FOR ALL
    USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.producto_lotes IS '[Admins] Acceso total a los lotes.';

DROP POLICY IF EXISTS staff_read_access ON public.producto_lotes;
CREATE POLICY staff_read_access ON public.producto_lotes FOR SELECT
    USING (public.fn_has_role('admin') OR public.fn_has_role('tecnico') OR public.fn_has_role('recepcionista'));
COMMENT ON POLICY staff_read_access ON public.producto_lotes IS '[Personal Interno] Pueden consultar los lotes existentes.';

DROP POLICY IF EXISTS admin_full_access ON public.stock;
CREATE POLICY admin_full_access ON public.stock FOR ALL
    USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.stock IS '[Admins] Acceso total al stock.';
-- NOTA: La tabla `stock` es gestionada por triggers. Las políticas aquí son una capa de seguridad adicional.

DROP POLICY IF EXISTS staff_read_access ON public.stock;
CREATE POLICY staff_read_access ON public.stock FOR SELECT
    USING (public.fn_has_role('admin') OR public.fn_has_role('tecnico') OR public.fn_has_role('recepcionista'));
COMMENT ON POLICY staff_read_access ON public.stock IS '[Personal Interno] Pueden consultar el stock actual.';

-- Tabla: public.movimientos_inventario (La más compleja)
DROP POLICY IF EXISTS admin_full_access ON public.movimientos_inventario;
CREATE POLICY admin_full_access ON public.movimientos_inventario FOR ALL
    USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.movimientos_inventario IS '[Admins] Acceso total a los movimientos. Único rol que puede hacer `ajuste`.';
-- NOTA: Los movimientos de tipo 'devolucion_compra' y 'garantia_reingreso' están por defecto solo permitidos para admin.
-- Para extender a recepcionista, se podría modificar la política de recepcionista.

DROP POLICY IF EXISTS staff_read_access ON public.movimientos_inventario;
CREATE POLICY staff_read_access ON public.movimientos_inventario FOR SELECT
    USING (public.fn_has_role('admin') OR public.fn_has_role('tecnico') OR public.fn_has_role('recepcionista'));
COMMENT ON POLICY staff_read_access ON public.movimientos_inventario IS '[Personal Interno] Pueden leer el historial de movimientos (Kardex).';

DROP POLICY IF EXISTS recep_insert_entradas ON public.movimientos_inventario;
CREATE POLICY recep_insert_entradas ON public.movimientos_inventario FOR INSERT
    WITH CHECK (
        public.fn_has_role('recepcionista') AND
        tipo IN ('entrada', 'devolucion_venta')
    );
COMMENT ON POLICY recep_insert_entradas ON public.movimientos_inventario IS '[Recepcionistas] Pueden registrar entradas por compra o devoluciones de clientes.';

DROP POLICY IF EXISTS tecnico_insert_salidas ON public.movimientos_inventario;
CREATE POLICY tecnico_insert_salidas ON public.movimientos_inventario FOR INSERT
    WITH CHECK (
        public.fn_has_role('tecnico') AND
        tipo IN ('salida', 'garantia_salida') AND
        referencia IS NOT NULL -- Debe estar asociado a una OT
    );
COMMENT ON POLICY tecnico_insert_salidas ON public.movimientos_inventario IS '[Técnicos] Pueden registrar salidas de repuestos para OTs o envíos a garantía.';
-- TODO: Se puede fortalecer el CHECK para validar que `referencia` corresponda a una OT real (ej. `referencia LIKE 'OT-%'`).


--------------------------------------------------------------------------------
-- 4) NOTAS DE INTEGRACIÓN FUTURA
--------------------------------------------------------------------------------
COMMENT ON TABLE public.movimientos_inventario IS 'El historial de movimientos (Kardex) es la fuente de verdad para el stock. Un futuro módulo de Punto de Venta (POS) deberá registrar una `salida` por cada venta, y el módulo de compras registrará una `entrada` al recibir mercancía.';

COMMIT;

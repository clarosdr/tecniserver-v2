BEGIN;

DO $$
BEGIN

-- 1) HELPERS (asegurar)
-- Vista de identidad para RLS: Mapea el usuario autenticado a su cliente_id y/o empresa_id y roles.
-- Se asume la existencia de las funciones fn_is_admin() y fn_has_role() de migraciones anteriores.
CREATE OR REPLACE VIEW public.v_portal_identity AS
SELECT
    u.id AS user_id,
    cu.cliente_id,
    eu.empresa_id,
    (SELECT array_agg(role_slug) FROM public.user_roles WHERE user_id = u.id) as roles
FROM auth.users u
LEFT JOIN public.cliente_users cu ON u.id = cu.user_id
LEFT JOIN public.empresa_users eu ON u.id = eu.user_id;


-- 2) ENABLE RLS en todas las tablas del módulo
ALTER TABLE public.mk_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mk_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mk_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mk_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mk_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mk_payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mk_shipments ENABLE ROW LEVEL SECURITY;


-- 3) POLÍTICAS

--
-- mk_products
--
DROP POLICY IF EXISTS admin_full_access ON public.mk_products;
CREATE POLICY admin_full_access ON public.mk_products
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.mk_products IS 'Los administradores tienen acceso total a todos los productos del marketplace.';

DROP POLICY IF EXISTS empresa_crud_own ON public.mk_products;
CREATE POLICY empresa_crud_own ON public.mk_products
  FOR ALL USING (empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()));
COMMENT ON POLICY empresa_crud_own ON public.mk_products IS 'Los usuarios de una empresa pueden gestionar (CRUD) únicamente sus propios productos.';

DROP POLICY IF EXISTS lectura_publica_auth ON public.mk_products;
CREATE POLICY lectura_publica_auth ON public.mk_products
  FOR SELECT TO authenticated USING (activo = true);
COMMENT ON POLICY lectura_publica_auth ON public.mk_products IS 'Cualquier usuario autenticado puede ver los productos que están activos en el marketplace.';

--
-- mk_orders
--
DROP POLICY IF EXISTS admin_full_access ON public.mk_orders;
CREATE POLICY admin_full_access ON public.mk_orders
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.mk_orders IS 'Los administradores tienen acceso total a todas las órdenes.';

DROP POLICY IF EXISTS empresa_read_own ON public.mk_orders;
CREATE POLICY empresa_read_own ON public.mk_orders
  FOR SELECT USING (empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()));
COMMENT ON POLICY empresa_read_own ON public.mk_orders IS 'Los usuarios de una empresa pueden ver las órdenes de sus productos.';

DROP POLICY IF EXISTS empresa_update_status ON public.mk_orders;
CREATE POLICY empresa_update_status ON public.mk_orders
  FOR UPDATE USING (empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()))
  WITH CHECK (estado IN ('en_proceso', 'enviada', 'entregada'));
COMMENT ON POLICY empresa_update_status ON public.mk_orders IS 'Los usuarios de una empresa pueden actualizar el estado de sus órdenes a estados de cumplimiento.';

DROP POLICY IF EXISTS cliente_read_own ON public.mk_orders;
CREATE POLICY cliente_read_own ON public.mk_orders
  FOR SELECT USING (cliente_id = (SELECT v.cliente_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()));
COMMENT ON POLICY cliente_read_own ON public.mk_orders IS 'Los clientes pueden ver únicamente sus propias órdenes.';

DROP POLICY IF EXISTS recepcionista_create ON public.mk_orders;
CREATE POLICY recepcionista_create ON public.mk_orders
  FOR INSERT TO authenticated WITH CHECK (public.fn_has_role('recepcionista') AND origen = 'admin' AND created_by = auth.uid());
COMMENT ON POLICY recepcionista_create ON public.mk_orders IS 'Los recepcionistas pueden crear órdenes desde el panel de administración.';

--
-- mk_order_items
--
DROP POLICY IF EXISTS admin_full_access ON public.mk_order_items;
CREATE POLICY admin_full_access ON public.mk_order_items
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.mk_order_items IS 'Los administradores tienen acceso total a los ítems de las órdenes.';

DROP POLICY IF EXISTS empresa_read_own ON public.mk_order_items;
CREATE POLICY empresa_read_own ON public.mk_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.mk_orders o
    WHERE o.id = mk_order_items.order_id
    AND o.empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid())
  ));
COMMENT ON POLICY empresa_read_own ON public.mk_order_items IS 'Los usuarios de empresa pueden ver los ítems de sus propias órdenes.';

DROP POLICY IF EXISTS cliente_read_own ON public.mk_order_items;
CREATE POLICY cliente_read_own ON public.mk_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.mk_orders o
    WHERE o.id = mk_order_items.order_id
    AND o.cliente_id = (SELECT v.cliente_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid())
  ));
COMMENT ON POLICY cliente_read_own ON public.mk_order_items IS 'Los clientes pueden ver los ítems de sus propias órdenes.';

--
-- mk_commission_rules
--
DROP POLICY IF EXISTS admin_full_access ON public.mk_commission_rules;
CREATE POLICY admin_full_access ON public.mk_commission_rules
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.mk_commission_rules IS 'Los administradores tienen acceso total a las reglas de comisión.';

DROP POLICY IF EXISTS empresa_admin_crud ON public.mk_commission_rules;
CREATE POLICY empresa_admin_crud ON public.mk_commission_rules
  FOR ALL USING (empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid() AND 'admin_empresa' = ANY(v.roles)))
  WITH CHECK (empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid() AND 'admin_empresa' = ANY(v.roles)));
COMMENT ON POLICY empresa_admin_crud ON public.mk_commission_rules IS 'Los administradores de empresa pueden gestionar (CRUD) las reglas de comisión de su propia empresa.';

--
-- mk_commissions
--
DROP POLICY IF EXISTS admin_full_access ON public.mk_commissions;
CREATE POLICY admin_full_access ON public.mk_commissions
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.mk_commissions IS 'Los administradores tienen acceso total a las comisiones generadas.';

DROP POLICY IF EXISTS empresa_read_own ON public.mk_commissions;
CREATE POLICY empresa_read_own ON public.mk_commissions
  FOR SELECT USING (empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()));
COMMENT ON POLICY empresa_read_own ON public.mk_commissions IS 'Los usuarios de empresa pueden ver las comisiones generadas por sus ventas.';

--
-- mk_payouts
--
DROP POLICY IF EXISTS admin_full_access ON public.mk_payouts;
CREATE POLICY admin_full_access ON public.mk_payouts
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.mk_payouts IS 'Los administradores tienen acceso total a las liquidaciones.';

DROP POLICY IF EXISTS empresa_read_own ON public.mk_payouts;
CREATE POLICY empresa_read_own ON public.mk_payouts
  FOR SELECT USING (empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()));
COMMENT ON POLICY empresa_read_own ON public.mk_payouts IS 'Los usuarios de empresa pueden ver sus propias liquidaciones.';

--
-- mk_payout_items
--
DROP POLICY IF EXISTS admin_full_access ON public.mk_payout_items;
CREATE POLICY admin_full_access ON public.mk_payout_items
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.mk_payout_items IS 'Los administradores tienen acceso total a los ítems de liquidaciones.';

DROP POLICY IF EXISTS empresa_read_own ON public.mk_payout_items;
CREATE POLICY empresa_read_own ON public.mk_payout_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.mk_payouts p
    WHERE p.id = mk_payout_items.payout_id
    AND p.empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid())
  ));
COMMENT ON POLICY empresa_read_own ON public.mk_payout_items IS 'Los usuarios de empresa pueden ver los ítems de sus propias liquidaciones.';

--
-- mk_shipments
--
DROP POLICY IF EXISTS admin_full_access ON public.mk_shipments;
CREATE POLICY admin_full_access ON public.mk_shipments
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.mk_shipments IS 'Los administradores tienen acceso total a los envíos.';

DROP POLICY IF EXISTS empresa_update_envio ON public.mk_shipments;
CREATE POLICY empresa_update_envio ON public.mk_shipments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.mk_orders o
    WHERE o.id = mk_shipments.order_id
    AND o.empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid())
  ));
COMMENT ON POLICY empresa_update_envio ON public.mk_shipments IS 'Las empresas pueden crear, ver y actualizar los envíos de sus propias órdenes.';

DROP POLICY IF EXISTS cliente_read_own ON public.mk_shipments;
CREATE POLICY cliente_read_own ON public.mk_shipments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.mk_orders o
    WHERE o.id = mk_shipments.order_id
    AND o.cliente_id = (SELECT v.cliente_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid())
  ));
COMMENT ON POLICY cliente_read_own ON public.mk_shipments IS 'Los clientes pueden ver la información de envío de sus órdenes.';

END $$;

COMMIT;

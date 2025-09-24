BEGIN;

DO $$
BEGIN

-- 1) Helpers (asegurar existencia)
-- Se asume la existencia de las siguientes vistas y funciones de migraciones anteriores,
-- las cuales son cruciales para que las políticas RLS funcionen correctamente.
-- v_portal_identity: Mapea auth.uid() a cliente_id y/o empresa_id.
-- fn_is_admin(): Devuelve true si el usuario actual es administrador.
-- fn_has_role(text): Devuelve true si el usuario actual tiene un rol específico.
COMMENT ON VIEW public.v_portal_identity IS 'Vista de identidad requerida para RLS, enlazando auth.users con perfiles de cliente/empresa.';

-- 2) ENABLE RLS en todas las tablas del módulo
ALTER TABLE public.points_ledger          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_balance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_rules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions            ENABLE ROW LEVEL SECURITY;

-- 3) POLÍTICAS

--
-- points_ledger (Libro mayor de puntos)
--
DROP POLICY IF EXISTS admin_full_access ON public.points_ledger;
CREATE POLICY admin_full_access ON public.points_ledger
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.points_ledger IS 'Los administradores tienen acceso total al libro mayor de puntos.';

DROP POLICY IF EXISTS recep_read ON public.points_ledger;
CREATE POLICY recep_read ON public.points_ledger
  FOR SELECT USING (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recep_read ON public.points_ledger IS 'Los recepcionistas pueden consultar todos los movimientos de puntos.';

DROP POLICY IF EXISTS cliente_read_own ON public.points_ledger;
CREATE POLICY cliente_read_own ON public.points_ledger
  FOR SELECT USING (cliente_id = (SELECT v.cliente_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()));
COMMENT ON POLICY cliente_read_own ON public.points_ledger IS 'Los clientes solo pueden ver sus propios movimientos de puntos.';

DROP POLICY IF EXISTS empresa_read_clients ON public.points_ledger;
CREATE POLICY empresa_read_clients ON public.points_ledger
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = points_ledger.cliente_id
    AND c.empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid())
  ));
COMMENT ON POLICY empresa_read_clients ON public.points_ledger IS 'Los usuarios de empresa pueden ver los movimientos de puntos de los clientes asociados a su empresa.';


--
-- points_balance (Saldos de puntos)
--
DROP POLICY IF EXISTS admin_full_access ON public.points_balance;
CREATE POLICY admin_full_access ON public.points_balance
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.points_balance IS 'Los administradores tienen acceso total a los saldos de puntos.';

DROP POLICY IF EXISTS recep_read ON public.points_balance;
CREATE POLICY recep_read ON public.points_balance
  FOR SELECT USING (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recep_read ON public.points_balance IS 'Los recepcionistas pueden consultar los saldos de puntos.';

DROP POLICY IF EXISTS cliente_read_own ON public.points_balance;
CREATE POLICY cliente_read_own ON public.points_balance
  FOR SELECT USING (cliente_id = (SELECT v.cliente_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()));
COMMENT ON POLICY cliente_read_own ON public.points_balance IS 'Los clientes solo pueden ver su propio saldo de puntos.';

DROP POLICY IF EXISTS empresa_read_clients ON public.points_balance;
CREATE POLICY empresa_read_clients ON public.points_balance
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = points_balance.cliente_id
    AND c.empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid())
  ));
COMMENT ON POLICY empresa_read_clients ON public.points_balance IS 'Los usuarios de empresa pueden ver los saldos de puntos de sus clientes.';


--
-- points_rules (Reglas de acumulación)
--
DROP POLICY IF EXISTS admin_full_access ON public.points_rules;
CREATE POLICY admin_full_access ON public.points_rules
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.points_rules IS 'Los administradores tienen control total sobre las reglas de puntos.';

DROP POLICY IF EXISTS recep_read ON public.points_rules;
CREATE POLICY recep_read ON public.points_rules
  FOR SELECT USING (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recep_read ON public.points_rules IS 'Los recepcionistas pueden leer las reglas para informar a los clientes.';


--
-- coupons (Cupones)
--
DROP POLICY IF EXISTS admin_full_access ON public.coupons;
CREATE POLICY admin_full_access ON public.coupons
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.coupons IS 'Los administradores tienen control total sobre los cupones.';

DROP POLICY IF EXISTS recep_crud ON public.coupons;
CREATE POLICY recep_crud ON public.coupons
  FOR ALL USING (public.fn_has_role('recepcionista'))
  WITH CHECK (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recep_crud ON public.coupons IS 'Los recepcionistas pueden crear, ver y actualizar cupones (no borrar).';

DROP POLICY IF EXISTS cliente_read ON public.coupons;
CREATE POLICY cliente_read ON public.coupons
  FOR SELECT USING (vigente = true AND (vence_at IS NULL OR vence_at >= current_date));
COMMENT ON POLICY cliente_read ON public.coupons IS 'Los clientes pueden ver los cupones vigentes para usarlos.';


--
-- redemptions (Canjes)
--
DROP POLICY IF EXISTS admin_full_access ON public.redemptions;
CREATE POLICY admin_full_access ON public.redemptions
  FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY admin_full_access ON public.redemptions IS 'Los administradores tienen acceso total a los registros de canjes.';

DROP POLICY IF EXISTS recep_create_select ON public.redemptions;
CREATE POLICY recep_create_select ON public.redemptions
  FOR ALL USING (public.fn_has_role('recepcionista'))
  WITH CHECK (public.fn_has_role('recepcionista'));
COMMENT ON POLICY recep_create_select ON public.redemptions IS 'Los recepcionistas pueden crear y consultar todos los canjes.';

DROP POLICY IF EXISTS cliente_read_own ON public.redemptions;
CREATE POLICY cliente_read_own ON public.redemptions
  FOR SELECT USING (cliente_id = (SELECT v.cliente_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid()));
COMMENT ON POLICY cliente_read_own ON public.redemptions IS 'Los clientes solo pueden ver su propio historial de canjes.';

DROP POLICY IF EXISTS empresa_read_clients ON public.redemptions;
CREATE POLICY empresa_read_clients ON public.redemptions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = redemptions.cliente_id
    AND c.empresa_id = (SELECT v.empresa_id FROM public.v_portal_identity v WHERE v.user_id = auth.uid())
  ));
COMMENT ON POLICY empresa_read_clients ON public.redemptions IS 'Los usuarios de empresa pueden ver los canjes de sus clientes asociados.';

END $$;

COMMIT;

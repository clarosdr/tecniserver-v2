-- supabase/sql/18_rls_portal.sql
-- Políticas de Seguridad a Nivel de Fila (RLS) para el portal de clientes y marketplace.
-- Asegura que los usuarios del portal (clientes y empresas) solo puedan acceder a sus propios datos.
-- Es transaccional (BEGIN/COMMIT) e idempotente (IF NOT EXISTS, CREATE OR REPLACE).

BEGIN;

DO $$
BEGIN

-- 1) ASEGURAR HELPERS DE ROLES Y VISTAS DE IDENTIDAD
-- Se re-declaran con CREATE OR REPLACE para garantizar que existan antes de crear las políticas.
-- Estas funciones y vistas son la base para las políticas de seguridad.

-- Función para verificar si el usuario tiene un rol específico
CREATE OR REPLACE FUNCTION public.fn_has_role(_role text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  -- Si no hay usuario, no tiene rol.
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  -- Verifica si el usuario tiene el rol en la tabla de asignación.
  RETURN EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_slug = _role
  );
END;
$$;

-- Función de conveniencia para verificar si el usuario es administrador.
CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN public.fn_has_role('admin');
END;
$$;

-- Vista que combina los roles de cada usuario en un array.
CREATE OR REPLACE VIEW public.v_user_roles AS
SELECT u.id AS user_id,
       u.email,
       COALESCE(array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL), '{}') AS roles
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email;

-- Vistas de conveniencia para simplificar las políticas RLS.
CREATE OR REPLACE VIEW public.v_is_admin AS SELECT user_id, 'admin' = ANY(roles) AS is_admin FROM public.v_user_roles;
CREATE OR REPLACE VIEW public.v_is_tecnico AS SELECT user_id, 'tecnico' = ANY(roles) AS is_tecnico FROM public.v_user_roles;
CREATE OR REPLACE VIEW public.v_is_recepcionista AS SELECT user_id, 'recepcionista' = ANY(roles) AS is_recepcionista FROM public.v_user_roles;
CREATE OR REPLACE VIEW public.v_is_cliente AS SELECT user_id, 'cliente' = ANY(roles) AS is_cliente FROM public.v_user_roles;
CREATE OR REPLACE VIEW public.v_is_empresa AS SELECT user_id, 'empresa' = ANY(roles) OR 'admin_empresa' = ANY(roles) AS is_empresa FROM public.v_user_roles;

-- Vista de Identidad del Portal
-- Mapa rápido de user -> cliente y/o empresa para políticas del portal.
CREATE OR REPLACE VIEW public.v_portal_identity AS
SELECT u.id AS user_id,
       cu.cliente_id,
       (SELECT eu.empresa_id FROM public.empresa_users eu WHERE eu.user_id = u.id LIMIT 1) AS empresa_id
FROM auth.users u
LEFT JOIN public.cliente_users cu ON cu.user_id = u.id;


-- 2) HABILITAR RLS EN LAS TABLAS DEL PORTAL
ALTER TABLE IF EXISTS public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.empresa_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cliente_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portal_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portal_tokens ENABLE ROW LEVEL SECURITY;


-- 3) POLÍTICAS PARA LAS NUEVAS TABLAS

-- Tabla: public.empresas
CREATE POLICY "admin_full_access" ON public.empresas FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY "admin_full_access" ON public.empresas IS 'Los administradores tienen acceso total a todas las empresas.';

CREATE POLICY "empresa_self_read" ON public.empresas FOR SELECT USING (EXISTS (SELECT 1 FROM public.empresa_users WHERE empresa_users.empresa_id = id AND empresa_users.user_id = auth.uid()));
COMMENT ON POLICY "empresa_self_read" ON public.empresas IS 'Los usuarios de una empresa pueden ver los datos de su propia empresa.';

CREATE POLICY "empresa_admin_update" ON public.empresas FOR UPDATE, DELETE USING (EXISTS (SELECT 1 FROM public.empresa_users WHERE empresa_users.empresa_id = id AND empresa_users.user_id = auth.uid() AND empresa_users.rol = 'admin_empresa'));
COMMENT ON POLICY "empresa_admin_update" ON public.empresas IS 'Solo los usuarios con el rol de "admin_empresa" pueden modificar o eliminar los datos de su empresa.';


-- Tabla: public.empresa_users
CREATE POLICY "admin_full_access" ON public.empresa_users FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY "admin_full_access" ON public.empresa_users IS 'Los administradores pueden gestionar todas las vinculaciones de usuarios a empresas.';

CREATE POLICY "empresa_admin_crud" ON public.empresa_users FOR ALL
  USING (empresa_id = (SELECT eu.empresa_id FROM public.empresa_users eu WHERE eu.user_id = auth.uid() AND eu.rol = 'admin_empresa'))
  WITH CHECK (empresa_id = (SELECT eu.empresa_id FROM public.empresa_users eu WHERE eu.user_id = auth.uid() AND eu.rol = 'admin_empresa'));
COMMENT ON POLICY "empresa_admin_crud" ON public.empresa_users IS 'Los "admin_empresa" pueden añadir, ver y eliminar usuarios dentro de su propia empresa.';


-- Tabla: public.cliente_users
CREATE POLICY "admin_full_access" ON public.cliente_users FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY "admin_full_access" ON public.cliente_users IS 'Los administradores pueden gestionar todas las vinculaciones de clientes a usuarios.';

CREATE POLICY "self_read" ON public.cliente_users FOR SELECT USING (user_id = auth.uid());
COMMENT ON POLICY "self_read" ON public.cliente_users IS 'Un usuario puede ver su propia vinculación con un cliente.';

CREATE POLICY "recepcionista_link" ON public.cliente_users FOR INSERT, DELETE USING (public.fn_has_role('recepcionista')) WITH CHECK (public.fn_has_role('recepcionista'));
COMMENT ON POLICY "recepcionista_link" ON public.cliente_users IS 'El personal de recepción puede vincular y desvincular clientes de usuarios del portal.';


-- Tabla: public.portal_notification_prefs
CREATE POLICY "admin_full_access" ON public.portal_notification_prefs FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY "admin_full_access" ON public.portal_notification_prefs IS 'Los administradores pueden ver/modificar las preferencias de cualquier usuario.';

CREATE POLICY "self_crud" ON public.portal_notification_prefs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
COMMENT ON POLICY "self_crud" ON public.portal_notification_prefs IS 'Los usuarios pueden gestionar sus propias preferencias de notificación.';


-- Tabla: public.portal_tokens
CREATE POLICY "admin_full_access" ON public.portal_tokens FOR ALL USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
COMMENT ON POLICY "admin_full_access" ON public.portal_tokens IS 'Los administradores tienen control total sobre los tokens seguros.';

CREATE POLICY "recepcionista_issue" ON public.portal_tokens FOR INSERT
  USING (public.fn_has_role('recepcionista'))
  WITH CHECK (public.fn_has_role('recepcionista') AND created_by = auth.uid());
COMMENT ON POLICY "recepcionista_issue" ON public.portal_tokens IS 'El personal de recepción puede emitir nuevos tokens seguros (ej. para aprobaciones).';

-- CREATE POLICY "read_ops" ON public.portal_tokens FOR SELECT USING (auth.role() = 'authenticated');
-- COMMENT ON POLICY "read_ops" ON public.portal_tokens IS 'Permite a cualquier usuario autenticado ver tokens; se deja comentado por seguridad.';


-- 4) VISIBILIDAD DE DATOS EXISTENTES DESDE PORTAL (POLÍTICAS ADICIONALES)

-- Tabla: public.clientes
CREATE POLICY IF NOT EXISTS "cliente_self_read" ON public.clientes FOR SELECT
  USING (id = (SELECT cliente_id FROM public.v_portal_identity WHERE user_id = auth.uid()));
COMMENT ON POLICY "cliente_self_read" ON public.clientes IS 'Un usuario del portal puede leer los datos de su perfil de cliente asociado.';

CREATE POLICY IF NOT EXISTS "empresa_read_clients" ON public.clientes FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM public.v_portal_identity WHERE user_id = auth.uid()));
COMMENT ON POLICY "empresa_read_clients" ON public.clientes IS 'Los usuarios de una empresa pueden ver los clientes que pertenecen a su empresa.';


-- Tabla: public.equipos_cliente
CREATE POLICY IF NOT EXISTS "cliente_read_own" ON public.equipos_cliente FOR SELECT
  USING (cliente_id = (SELECT cliente_id FROM public.v_portal_identity WHERE user_id = auth.uid()));
COMMENT ON POLICY "cliente_read_own" ON public.equipos_cliente IS 'Un cliente del portal puede ver sus propios equipos registrados.';

CREATE POLICY IF NOT EXISTS "empresa_read_clients_equipos" ON public.equipos_cliente FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = equipos_cliente.cliente_id AND c.empresa_id = (SELECT empresa_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
COMMENT ON POLICY "empresa_read_clients_equipos" ON public.equipos_cliente IS 'Los usuarios de una empresa pueden ver los equipos de los clientes de su empresa.';


-- Tablas de OT: ot, ot_historial, ot_accesorios, ot_adjuntos
DO $ot_tables$
DECLARE
  _t text;
BEGIN
  FOREACH _t IN ARRAY ARRAY['ot', 'ot_historial', 'ot_accesorios', 'ot_adjuntos']
  LOOP
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "cliente_read_own_%1$s" ON public.%1$s FOR SELECT
        USING (ot_id IN (SELECT id FROM public.ot WHERE cliente_id = (SELECT cliente_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
      COMMENT ON POLICY "cliente_read_own_%1$s" ON public.%1$s IS ''Un cliente puede ver los detalles de sus propias órdenes de trabajo.'';
      
      CREATE POLICY IF NOT EXISTS "empresa_read_%1$s" ON public.%1$s FOR SELECT
        USING (ot_id IN (SELECT ot.id FROM public.ot JOIN public.clientes c ON ot.cliente_id = c.id WHERE c.empresa_id = (SELECT empresa_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
      COMMENT ON POLICY "empresa_read_%1$s" ON public.%1$s IS ''Una empresa puede ver los detalles de las OTs de sus clientes.'';
    ', _t);
  END LOOP;
END $ot_tables$;


-- Tablas de Presupuestos: presupuestos, presupuesto_items, presupuesto_firmas
CREATE POLICY IF NOT EXISTS "cliente_read_own" ON public.presupuestos FOR SELECT
  USING (cliente_id = (SELECT cliente_id FROM public.v_portal_identity WHERE user_id = auth.uid()));
COMMENT ON POLICY "cliente_read_own" ON public.presupuestos IS 'Un cliente del portal puede ver sus propios presupuestos.';

CREATE POLICY IF NOT EXISTS "empresa_read" ON public.presupuestos FOR SELECT
  USING (cliente_id IN (SELECT c.id FROM public.clientes c WHERE c.empresa_id = (SELECT empresa_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
COMMENT ON POLICY "empresa_read" ON public.presupuestos IS 'Una empresa puede ver los presupuestos de sus clientes.';

CREATE POLICY IF NOT EXISTS "cliente_read_own_items" ON public.presupuesto_items FOR SELECT
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE cliente_id = (SELECT cliente_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
COMMENT ON POLICY "cliente_read_own_items" ON public.presupuesto_items IS 'Un cliente del portal puede ver los ítems de sus presupuestos.';

CREATE POLICY IF NOT EXISTS "empresa_read_items" ON public.presupuesto_items FOR SELECT
  USING (presupuesto_id IN (SELECT p.id FROM public.presupuestos p JOIN public.clientes c ON p.cliente_id = c.id WHERE c.empresa_id = (SELECT empresa_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
COMMENT ON POLICY "empresa_read_items" ON public.presupuesto_items IS 'Una empresa puede ver los ítems de los presupuestos de sus clientes.';

CREATE POLICY IF NOT EXISTS "cliente_sign" ON public.presupuesto_firmas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
COMMENT ON POLICY "cliente_sign" ON public.presupuesto_firmas IS 'Permite a cualquier usuario autenticado firmar, la validación fina se hace a nivel de API.';


-- Tablas de Ventas: ventas, venta_items, pagos
CREATE POLICY IF NOT EXISTS "cliente_read_own" ON public.ventas FOR SELECT
  USING (cliente_id = (SELECT cliente_id FROM public.v_portal_identity WHERE user_id = auth.uid()));
COMMENT ON POLICY "cliente_read_own" ON public.ventas IS 'Un cliente del portal puede ver su historial de ventas/facturas.';

CREATE POLICY IF NOT EXISTS "empresa_read" ON public.ventas FOR SELECT
  USING (cliente_id IN (SELECT c.id FROM public.clientes c WHERE c.empresa_id = (SELECT empresa_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
COMMENT ON POLICY "empresa_read" ON public.ventas IS 'Una empresa puede ver el historial de ventas/facturas de sus clientes.';

CREATE POLICY IF NOT EXISTS "cliente_read_own_items" ON public.venta_items FOR SELECT
  USING (venta_id IN (SELECT id FROM public.ventas WHERE cliente_id = (SELECT cliente_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
COMMENT ON POLICY "cliente_read_own_items" ON public.venta_items IS 'Un cliente del portal puede ver los detalles de sus compras.';

CREATE POLICY IF NOT EXISTS "empresa_read_items" ON public.venta_items FOR SELECT
  USING (venta_id IN (SELECT v.id FROM public.ventas v JOIN public.clientes c ON v.cliente_id = c.id WHERE c.empresa_id = (SELECT empresa_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
COMMENT ON POLICY "empresa_read_items" ON public.venta_items IS 'Una empresa puede ver los detalles de las compras de sus clientes.';

CREATE POLICY IF NOT EXISTS "cliente_read_own_pagos" ON public.pagos FOR SELECT
  USING (venta_id IN (SELECT id FROM public.ventas WHERE cliente_id = (SELECT cliente_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
COMMENT ON POLICY "cliente_read_own_pagos" ON public.pagos IS 'Un cliente del portal puede ver los pagos asociados a sus facturas.';

CREATE POLICY IF NOT EXISTS "empresa_read_pagos" ON public.pagos FOR SELECT
  USING (venta_id IN (SELECT v.id FROM public.ventas v JOIN public.clientes c ON v.cliente_id = c.id WHERE c.empresa_id = (SELECT empresa_id FROM public.v_portal_identity WHERE user_id = auth.uid())));
COMMENT ON POLICY "empresa_read_pagos" ON public.pagos IS 'Una empresa puede ver los pagos de las facturas de sus clientes.';


END;
$$;

COMMIT;

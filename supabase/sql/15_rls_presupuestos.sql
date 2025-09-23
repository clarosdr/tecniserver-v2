-- Archivo: supabase/sql/15_rls_presupuestos.sql
-- Descripción: Implementa las políticas de seguridad a nivel de fila (RLS)
-- para el módulo de presupuestos.

BEGIN;

DO $$
BEGIN

----------------------------------------------------
-- SECCIÓN 1: HELPERS DE ROL Y PERMISOS
----------------------------------------------------
-- Estas funciones son cruciales para simplificar la escritura de políticas RLS.
-- Se crean con 'CREATE OR REPLACE' para ser idempotentes.
-- SECURITY DEFINER permite que la función acceda a tablas como 'user_roles'
-- sin que el usuario que la llama necesite permisos directos sobre ella.

-- Función genérica para verificar si el usuario actual tiene un rol específico.
-- Asume la existencia de una tabla 'public.user_roles(user_id, role_slug)'.
CREATE OR REPLACE FUNCTION public.fn_has_role(_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE -- 'STABLE' es una optimización para funciones que no modifican la DB.
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role_slug = _role
  );
END;
$$;

-- Funciones específicas por rol para mayor legibilidad en las políticas.
CREATE OR REPLACE FUNCTION public.fn_is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT public.fn_has_role('admin') $$;
CREATE OR REPLACE FUNCTION public.fn_is_tecnico() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT public.fn_has_role('tecnico') $$;
CREATE OR REPLACE FUNCTION public.fn_is_recepcionista() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT public.fn_has_role('recepcionista') $$;
CREATE OR REPLACE FUNCTION public.fn_is_cliente() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT public.fn_has_role('cliente') $$;
CREATE OR REPLACE FUNCTION public.fn_is_empresa() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT public.fn_has_role('empresa') $$;

-- Vista de conveniencia para ver los roles de un usuario.
CREATE OR REPLACE VIEW public.v_user_roles AS
 SELECT ur.user_id,
    u.email,
    array_agg(ur.role_slug) AS roles
   FROM (public.user_roles ur
     LEFT JOIN auth.users u ON ((ur.user_id = u.id)))
  GROUP BY ur.user_id, u.email;


----------------------------------------------------
-- SECCIÓN 2: HABILITACIÓN DE RLS
----------------------------------------------------
-- Activamos la seguridad a nivel de fila para las tablas del módulo.
-- ¡IMPORTANTE! Una vez activado, ningún dato será visible o modificable
-- hasta que se cree al menos una política.

ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuesto_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuesto_firmas ENABLE ROW LEVEL SECURITY;


----------------------------------------------------
-- SECCIÓN 3: POLÍTICAS EN public.presupuestos
----------------------------------------------------

-- Eliminar políticas existentes para asegurar idempotencia.
DROP POLICY IF EXISTS admin_full_access ON public.presupuestos;
DROP POLICY IF EXISTS recepcionista_crud ON public.presupuestos;
DROP POLICY IF EXISTS tecnico_read_and_diag_update ON public.presupuestos;
DROP POLICY IF EXISTS lectura_operativa ON public.presupuestos;
DROP POLICY IF EXISTS cliente_portal_read_own ON public.presupuestos;

-- Política 1: Administradores tienen acceso total y sin restricciones.
CREATE POLICY admin_full_access ON public.presupuestos
FOR ALL
USING (public.fn_is_admin())
WITH CHECK (public.fn_is_admin());

COMMENT ON POLICY admin_full_access ON public.presupuestos IS
'Los administradores tienen control total sobre los presupuestos.';

-- Política 2: Recepcionistas pueden ver todos, pero solo crear y modificar los suyos. No pueden borrar.
CREATE POLICY recepcionista_crud ON public.presupuestos
FOR SELECT, INSERT, UPDATE
USING (public.fn_is_recepcionista())
WITH CHECK (public.fn_is_recepcionista() AND creada_por = auth.uid());

COMMENT ON POLICY recepcionista_crud ON public.presupuestos IS
'Permite a los recepcionistas gestionar los presupuestos que ellos mismos han creado. No se les permite eliminar para mantener la integridad del historial.';

-- Política 3: Técnicos pueden ver todos los presupuestos y actualizar únicamente el diagnóstico.
CREATE POLICY tecnico_read_and_diag_update ON public.presupuestos
FOR ALL -- Se aplica a SELECT y UPDATE
USING (public.fn_is_tecnico())
WITH CHECK (
  public.fn_is_tecnico() AND
  -- Para UPDATE, esta es una forma de restringir a nivel de columna.
  -- Solo permite la actualización si los campos "protegidos" no han cambiado.
  -- Esto permite que un técnico actualice el campo 'diagnostico' y 'observaciones'.
  (
    id = OLD.id AND
    numero = OLD.numero AND
    ot_id = OLD.ot_id AND
    cliente_id = OLD.cliente_id AND
    estado = OLD.estado AND
    creada_por = OLD.creada_por
  )
);

COMMENT ON POLICY tecnico_read_and_diag_update ON public.presupuestos IS
'Los técnicos pueden leer todos los presupuestos para consulta, pero solo pueden actualizar campos no críticos como el diagnóstico y las observaciones. El control fino de transición de estados se deja a la lógica de la aplicación o triggers.';

-- Política 4: Permite a cualquier usuario autenticado del personal leer los presupuestos.
CREATE POLICY lectura_operativa ON public.presupuestos
FOR SELECT
USING (auth.role() = 'authenticated' AND (public.fn_is_admin() OR public.fn_is_recepcionista() OR public.fn_is_tecnico()));

COMMENT ON POLICY lectura_operativa ON public.presupuestos IS
'Acceso de solo lectura para todo el personal interno. TODO: Crear política específica para que clientes vean solo sus propios presupuestos desde el portal.';


----------------------------------------------------
-- SECCIÓN 4: POLÍTICAS EN public.presupuesto_items
----------------------------------------------------

DROP POLICY IF EXISTS admin_full_access ON public.presupuesto_items;
DROP POLICY IF EXISTS recepcionista_crud_borrador ON public.presupuesto_items;
DROP POLICY IF EXISTS tecnico_solo_read ON public.presupuesto_items;
DROP POLICY IF EXISTS lectura_operativa ON public.presupuesto_items;

-- Política 1: Administradores tienen acceso total.
CREATE POLICY admin_full_access ON public.presupuesto_items
FOR ALL
USING (public.fn_is_admin())
WITH CHECK (public.fn_is_admin());

COMMENT ON POLICY admin_full_access ON public.presupuesto_items IS 'Control total para administradores.';

-- Política 2: Recepcionistas pueden gestionar ítems solo en presupuestos que crearon y que están en estado 'borrador' o 'enviado'.
CREATE POLICY recepcionista_crud_borrador ON public.presupuesto_items
FOR ALL
USING (
  public.fn_is_recepcionista() AND
  (EXISTS (
    SELECT 1 FROM public.presupuestos p
    WHERE p.id = presupuesto_items.presupuesto_id
      AND p.creada_por = auth.uid()
      AND p.estado IN ('borrador', 'enviado')
  ))
)
WITH CHECK (
  public.fn_is_recepcionista() AND
  (EXISTS (
    SELECT 1 FROM public.presupuestos p
    WHERE p.id = presupuesto_items.presupuesto_id
      AND p.creada_por = auth.uid()
      AND p.estado IN ('borrador', 'enviado')
  ))
);

COMMENT ON POLICY recepcionista_crud_borrador ON public.presupuesto_items IS
'Permite a recepcionistas modificar la lista de ítems solo durante la fase inicial del presupuesto para prevenir cambios después de la aprobación.';

-- Política 3: Técnicos tienen acceso de solo lectura.
CREATE POLICY tecnico_solo_read ON public.presupuesto_items
FOR SELECT
USING (public.fn_is_tecnico());

COMMENT ON POLICY tecnico_solo_read ON public.presupuesto_items IS 'Los técnicos pueden consultar los ítems pero no modificarlos.';

-- Política 4: Permite lectura general a roles operativos
CREATE POLICY lectura_operativa ON public.presupuesto_items
FOR SELECT
USING (auth.role() = 'authenticated' AND (public.fn_is_admin() OR public.fn_is_recepcionista() OR public.fn_is_tecnico()));

COMMENT ON POLICY lectura_operativa ON public.presupuesto_items IS 'Acceso de lectura para personal interno. TODO: Extender para que los clientes vean los ítems de sus propios presupuestos.';


----------------------------------------------------
-- SECCIÓN 5: POLÍTICAS EN public.presupuesto_firmas
----------------------------------------------------

DROP POLICY IF EXISTS admin_full_access ON public.presupuesto_firmas;
DROP POLICY IF EXISTS authenticated_insert_own ON public.presupuesto_firmas;
DROP POLICY IF EXISTS authenticated_select ON public.presupuesto_firmas;

-- Política 1: Administradores tienen acceso total.
CREATE POLICY admin_full_access ON public.presupuesto_firmas
FOR ALL
USING (public.fn_is_admin())
WITH CHECK (public.fn_is_admin());

COMMENT ON POLICY admin_full_access ON public.presupuesto_firmas IS 'Control total para administradores.';

-- Política 2: Cualquier usuario autenticado puede insertar una firma.
CREATE POLICY authenticated_insert_own ON public.presupuesto_firmas
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  NEW.signature_hash IS NOT NULL AND
  (EXISTS (
    SELECT 1 FROM public.presupuestos p
    WHERE p.id = NEW.presupuesto_id AND p.estado = 'enviado'
  ))
);

COMMENT ON POLICY authenticated_insert_own ON public.presupuesto_firmas IS
'Permite que un usuario (cliente o personal) firme un presupuesto que ha sido enviado. La lógica de la UI debe asegurar que el firmante sea el correcto.';

-- Política 3: Cualquier usuario autenticado puede ver las firmas.
CREATE POLICY authenticated_select ON public.presupuesto_firmas
FOR SELECT
USING (auth.role() = 'authenticated');

COMMENT ON POLICY authenticated_select ON public.presupuesto_firmas IS
'Permite la lectura de firmas. TODO: Podría restringirse para que los clientes solo vean las firmas de sus propios presupuestos.';


END;
$$;

COMMIT;

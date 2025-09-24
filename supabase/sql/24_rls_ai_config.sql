BEGIN;

DO $$
BEGIN

  -- 1) ASEGURAR HELPERS
  -- Se asume que las siguientes vistas y funciones ya existen a partir de módulos anteriores
  -- y están disponibles para ser usadas en las políticas.
  -- - public.v_user_roles
  -- - public.v_is_admin
  -- - public.v_portal_identity
  -- - public.fn_is_admin()

  -- 2) HABILITAR RLS EN TABLAS DEL MÓDULO DE IA
  ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ai_provider_keys ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ai_metrics_daily ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ai_quotas ENABLE ROW LEVEL SECURITY;

  -- 3) POLÍTICAS DE ACCESO

  -- Tabla: ai_providers (Catálogo de modelos disponibles)
  -- ----------------------------------------------------
  DROP POLICY IF EXISTS admin_full_access ON public.ai_providers;
  CREATE POLICY admin_full_access ON public.ai_providers
    FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
  COMMENT ON POLICY admin_full_access ON public.ai_providers IS 'Los administradores tienen acceso total para gestionar los proveedores de IA.';

  DROP POLICY IF EXISTS recep_read ON public.ai_providers;
  CREATE POLICY recep_read ON public.ai_providers
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.v_user_roles
        WHERE user_id = auth.uid() AND role_slug IN ('recepcionista', 'tecnico')
      )
    );
  COMMENT ON POLICY recep_read ON public.ai_providers IS 'Recepcionistas y técnicos pueden visualizar los proveedores de IA disponibles.';

  -- Tabla: ai_provider_keys (Alias y hashes de las claves de API)
  -- ------------------------------------------------------------
  DROP POLICY IF EXISTS admin_full_access ON public.ai_provider_keys;
  CREATE POLICY admin_full_access ON public.ai_provider_keys
    FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
  COMMENT ON POLICY admin_full_access ON public.ai_provider_keys IS 'Los administradores tienen acceso total a la gestión de claves de API.';

  DROP POLICY IF EXISTS empresa_read_own ON public.ai_provider_keys;
  CREATE POLICY empresa_read_own ON public.ai_provider_keys
    FOR SELECT
    USING (
      scope = 'global' OR
      empresa_id = (SELECT vpi.empresa_id FROM public.v_portal_identity vpi WHERE vpi.user_id = auth.uid())
    );
  COMMENT ON POLICY empresa_read_own ON public.ai_provider_keys IS 'Los usuarios de empresa pueden ver las claves globales y las de su propia empresa.';
  -- Nota: La gestión (INSERT/UPDATE/DELETE) de claves es centralizada solo para administradores.

  -- Tabla: ai_prompts (Catálogo de plantillas de prompts)
  -- ------------------------------------------------------
  DROP POLICY IF EXISTS admin_full_access ON public.ai_prompts;
  CREATE POLICY admin_full_access ON public.ai_prompts
    FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
  COMMENT ON POLICY admin_full_access ON public.ai_prompts IS 'Los administradores tienen acceso total para gestionar las plantillas de prompts.';

  DROP POLICY IF EXISTS recep_crud_prompts ON public.ai_prompts;
  CREATE POLICY recep_crud_prompts ON public.ai_prompts
    FOR SELECT, INSERT, UPDATE
    USING (EXISTS (SELECT 1 FROM public.v_user_roles WHERE user_id = auth.uid() AND role_slug = 'recepcionista'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.v_user_roles WHERE user_id = auth.uid() AND role_slug = 'recepcionista'));
  COMMENT ON POLICY recep_crud_prompts ON public.ai_prompts IS 'Recepcionistas pueden crear, ver y actualizar plantillas de prompts, pero no eliminarlas.';

  DROP POLICY IF EXISTS tecnico_read ON public.ai_prompts;
  CREATE POLICY tecnico_read ON public.ai_prompts
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.v_user_roles WHERE user_id = auth.uid() AND role_slug = 'tecnico'));
  COMMENT ON POLICY tecnico_read ON public.ai_prompts IS 'Los técnicos pueden leer la lista de plantillas de prompts disponibles.';

  -- Tabla: ai_runs (Logs de ejecuciones de IA)
  -- --------------------------------------------
  DROP POLICY IF EXISTS admin_full_access ON public.ai_runs;
  CREATE POLICY admin_full_access ON public.ai_runs
    FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
  COMMENT ON POLICY admin_full_access ON public.ai_runs IS 'Los administradores tienen acceso total a los registros de ejecuciones de IA.';

  DROP POLICY IF EXISTS empresa_read_own ON public.ai_runs;
  CREATE POLICY empresa_read_own ON public.ai_runs
    FOR SELECT
    USING (empresa_id = (SELECT vpi.empresa_id FROM public.v_portal_identity vpi WHERE vpi.user_id = auth.uid()));
  COMMENT ON POLICY empresa_read_own ON public.ai_runs IS 'Los usuarios de una empresa pueden ver los registros de ejecuciones de su propia empresa.';

  DROP POLICY IF EXISTS user_read_own ON public.ai_runs;
  CREATE POLICY user_read_own ON public.ai_runs
    FOR SELECT
    USING (usuario_id = auth.uid());
  COMMENT ON POLICY user_read_own ON public.ai_runs IS 'Los usuarios pueden ver sus propios registros de ejecuciones de IA.';
  -- Nota: La inserción de runs es manejada por el backend con privilegios elevados.

  -- Tabla: ai_metrics_daily (Métricas diarias de uso)
  -- --------------------------------------------------
  DROP POLICY IF EXISTS admin_full_access ON public.ai_metrics_daily;
  CREATE POLICY admin_full_access ON public.ai_metrics_daily
    FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
  COMMENT ON POLICY admin_full_access ON public.ai_metrics_daily IS 'Los administradores tienen acceso total a las métricas diarias de IA.';

  DROP POLICY IF EXISTS empresa_read_own ON public.ai_metrics_daily;
  CREATE POLICY empresa_read_own ON public.ai_metrics_daily
    FOR SELECT
    USING (empresa_id = (SELECT vpi.empresa_id FROM public.v_portal_identity vpi WHERE vpi.user_id = auth.uid()));
  COMMENT ON POLICY empresa_read_own ON public.ai_metrics_daily IS 'Los usuarios de empresa pueden ver las métricas de su propia empresa.';

  DROP POLICY IF EXISTS user_read_own ON public.ai_metrics_daily;
  CREATE POLICY user_read_own ON public.ai_metrics_daily
    FOR SELECT
    USING (usuario_id = auth.uid());
  COMMENT ON POLICY user_read_own ON public.ai_metrics_daily IS 'Los usuarios pueden ver sus propias métricas diarias de IA, si se exponen en la UI.';

  -- Tabla: ai_quotas (Cuotas y límites de uso)
  -- ---------------------------------------------
  DROP POLICY IF EXISTS admin_full_access ON public.ai_quotas;
  CREATE POLICY admin_full_access ON public.ai_quotas
    FOR ALL
    USING (public.fn_is_admin())
    WITH CHECK (public.fn_is_admin());
  COMMENT ON POLICY admin_full_access ON public.ai_quotas IS 'Los administradores tienen acceso total para gestionar las cuotas de IA.';

  DROP POLICY IF EXISTS empresa_read_own ON public.ai_quotas;
  CREATE POLICY empresa_read_own ON public.ai_quotas
    FOR SELECT
    USING (
      scope = 'global' OR
      empresa_id = (SELECT vpi.empresa_id FROM public.v_portal_identity vpi WHERE vpi.user_id = auth.uid())
    );
  COMMENT ON POLICY empresa_read_own ON public.ai_quotas IS 'Los usuarios de empresa pueden ver las cuotas globales y las de su empresa, pero no modificarlas.';

END $$;

COMMIT;

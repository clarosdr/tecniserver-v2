BEGIN;

DO $$
BEGIN

-- 1) CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,                 -- ej: 'openai', 'gemini', 'claude'
  modelo text NOT NULL,                 -- ej: 'gpt-4o-mini', 'gemini-1.5-pro'
  endpoint text,                        -- URL si aplica
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_provider ON public.ai_providers (LOWER(nombre), LOWER(modelo));

CREATE TABLE IF NOT EXISTS public.ai_provider_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global','empresa','taller')),
  empresa_id uuid NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  key_alias text NOT NULL,              -- alias legible
  key_hash text NOT NULL,               -- guarda solo hash/últimos 4 (no la key)
  meta jsonb,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ai_keys_provider ON public.ai_provider_keys(provider_id);

-- 2) CATÁLOGO DE PROMPTS (plantillas)
CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,          -- ej: 'ot.resumen', 'pos.ticket'
  titulo text NOT NULL,
  cuerpo text NOT NULL,                 -- plantilla (no datos)
  version int NOT NULL DEFAULT 1,
  activo boolean DEFAULT true,
  created_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 3) EJECUCIONES / RUNS
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NULL REFERENCES public.ai_prompts(id) ON DELETE SET NULL,
  provider_id uuid NULL REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  usuario_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  empresa_id uuid NULL REFERENCES public.empresas(id) ON DELETE SET NULL,
  input jsonb NOT NULL,                 -- variables/snapshot de datos
  output jsonb,                         -- salida cruda (o referencia a Storage)
  cost_usd numeric(12,6),               -- costo estimado
  tokens_in int, tokens_out int,
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','error','blocked')),
  error_msg text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ai_runs_prompt ON public.ai_runs(prompt_id);
CREATE INDEX IF NOT EXISTS ix_ai_runs_user ON public.ai_runs(usuario_id);

-- 4) MÉTRICAS & CUOTAS
CREATE TABLE IF NOT EXISTS public.ai_metrics_daily (
  fecha date NOT NULL,
  empresa_id uuid NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id uuid NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  runs int NOT NULL DEFAULT 0,
  tokens_in bigint NOT NULL DEFAULT 0,
  tokens_out bigint NOT NULL DEFAULT 0,
  cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  PRIMARY KEY (fecha, COALESCE(empresa_id, '00000000-0000-0000-0000-000000000000'), COALESCE(usuario_id, '00000000-0000-0000-0000-000000000000'))
);

CREATE TABLE IF NOT EXISTS public.ai_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('global','empresa','usuario')),
  empresa_id uuid NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id uuid NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_runs_day int, max_tokens_day bigint, max_cost_day numeric(12,6),
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5) FUNCIONES DE MÉTRICAS
CREATE OR REPLACE FUNCTION public.fn_ai_metrics_accumulate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.ai_metrics_daily(fecha, empresa_id, usuario_id, runs, tokens_in, tokens_out, cost_usd)
  VALUES (current_date, NEW.empresa_id, NEW.usuario_id, 1, COALESCE(NEW.tokens_in,0), COALESCE(NEW.tokens_out,0), COALESCE(NEW.cost_usd,0))
  ON CONFLICT (fecha, COALESCE(empresa_id, '00000000-0000-0000-0000-000000000000'), COALESCE(usuario_id, '00000000-0000-0000-0000-000000000000'))
  DO UPDATE SET
    runs = public.ai_metrics_daily.runs + 1,
    tokens_in = public.ai_metrics_daily.tokens_in + COALESCE(EXCLUDED.tokens_in,0),
    tokens_out = public.ai_metrics_daily.tokens_out + COALESCE(EXCLUDED.tokens_out,0),
    cost_usd = public.ai_metrics_daily.cost_usd + COALESCE(EXCLUDED.cost_usd,0);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_ai_metrics_accumulate ON public.ai_runs;
CREATE TRIGGER trg_ai_metrics_accumulate
AFTER INSERT ON public.ai_runs
FOR EACH ROW EXECUTE FUNCTION public.fn_ai_metrics_accumulate();

-- 6) VISTAS
CREATE OR REPLACE VIEW public.v_ai_runs_resumen AS
SELECT r.id, r.created_at, p.codigo AS prompt, pr.nombre AS provider, r.status, r.tokens_in, r.tokens_out, r.cost_usd, r.usuario_id, r.empresa_id
FROM public.ai_runs r
LEFT JOIN public.ai_prompts p ON p.id = r.prompt_id
LEFT JOIN public.ai_providers pr ON pr.id = r.provider_id
ORDER BY r.created_at DESC;

COMMENT ON VIEW public.v_ai_runs_resumen IS 'Resumen de ejecuciones IA por día/usuario/empresa';

END $$;

COMMIT;

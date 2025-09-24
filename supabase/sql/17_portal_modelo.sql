-- supabase/sql/17_portal_modelo.sql
-- Modelo de datos para el portal de clientes y marketplace de empresas.
-- Incluye tablas para empresas, usuarios, preferencias, tokens y funciones auxiliares.
-- Es transaccional (BEGIN/COMMIT) e idempotente (IF NOT EXISTS).

BEGIN;

DO $$
BEGIN

-- 1) EMPRESAS (socias del marketplace/portal)
CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  nit text,
  email text,
  phone text,
  direccion text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_emp_nombre ON public.empresas(LOWER(nombre));

COMMENT ON TABLE public.empresas IS 'Almacena información sobre las empresas asociadas al portal o marketplace.';

-- Vincular usuarios a una empresa (varios usuarios por empresa)
CREATE TABLE IF NOT EXISTS public.empresa_users (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rol text NOT NULL DEFAULT 'empresa' CHECK (rol IN ('empresa','admin_empresa')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, empresa_id)
);
CREATE INDEX IF NOT EXISTS idx_empusers_empresa ON public.empresa_users(empresa_id);

COMMENT ON TABLE public.empresa_users IS 'Tabla de unión para vincular usuarios de Supabase Auth con empresas.';

-- (Opcional) Cliente puede pertenecer a una empresa
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS empresa_id uuid NULL REFERENCES public.empresas(id) ON DELETE SET NULL;


-- 2) PORTAL: Vínculo usuario ↔ cliente (acceso del cliente a “sus” datos)
CREATE TABLE IF NOT EXISTS public.cliente_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE UNIQUE, -- Un cliente solo puede ser asignado a un usuario del portal
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cu_cliente ON public.cliente_users(cliente_id);

COMMENT ON TABLE public.cliente_users IS 'Vincula un usuario de Supabase Auth con un registro de cliente, dándole acceso al portal.';


-- 3) PREFERENCIAS DE NOTIFICACIÓN DEL PORTAL
CREATE TABLE IF NOT EXISTS public.portal_notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  canal_email boolean DEFAULT true,
  canal_sms boolean DEFAULT false,
  canal_push boolean DEFAULT false,
  canal_whatsapp boolean DEFAULT false,
  quiet_hours jsonb, -- ej {"start":"21:00","end":"07:00"}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.portal_notification_prefs IS 'Preferencias de notificación para los usuarios del portal.';


-- 4) ENLACES SEGUROS / TOKENS (aprobaciones, consulta rápida)
CREATE TABLE IF NOT EXISTS public.portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('presupuesto_view','presupuesto_sign','ot_view')),
  ref_id uuid NOT NULL,  -- id del recurso (presupuesto.id / ot.id)
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  max_uses int NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  use_count int NOT NULL DEFAULT 0,
  created_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pt_kind_ref ON public.portal_tokens(kind, ref_id);

COMMENT ON TABLE public.portal_tokens IS 'Almacena tokens de un solo uso o de tiempo limitado para acciones seguras sin login.';


-- 5) FUNCIONES AUXILIARES

-- Generar token corto base64-url (sin dependencias externas)
CREATE OR REPLACE FUNCTION public.fn_gen_token(_len int DEFAULT 32)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT replace(replace(encode(gen_random_bytes(_len),'base64'),'=',''),'/','_');
$$;

COMMENT ON FUNCTION public.fn_gen_token(int) IS 'Genera un token aleatorio, corto y seguro para URLs.';

-- Emitir token para un recurso
CREATE OR REPLACE FUNCTION public.fn_issue_portal_token(_kind text, _ref uuid, _ttl_minutes int DEFAULT 120, _max_uses int DEFAULT 1)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _t text;
BEGIN
  _t := public.fn_gen_token(24);
  INSERT INTO public.portal_tokens(kind, ref_id, token, expires_at, max_uses, created_by)
  VALUES (_kind, _ref, _t, now() + make_interval(mins => _ttl_minutes), _max_uses, auth.uid());
  RETURN _t;
END;
$$;

COMMENT ON FUNCTION public.fn_issue_portal_token(text, uuid, int, int) IS 'Crea y almacena un nuevo token para un recurso específico, retornando el token.';


-- Validar/consumir token (incrementa use_count si vigente)
CREATE OR REPLACE FUNCTION public.fn_consume_portal_token(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _ref uuid;
BEGIN
  UPDATE public.portal_tokens
  SET use_count = use_count + 1
  WHERE token = _token
    AND now() < expires_at
    AND use_count < max_uses
  RETURNING ref_id INTO _ref;

  IF _ref IS NULL THEN
    RAISE EXCEPTION 'Token inválido, expirado o ya utilizado.';
  END IF;
  RETURN _ref;
END;
$$;

COMMENT ON FUNCTION public.fn_consume_portal_token(text) IS 'Valida un token, incrementa su contador de uso y devuelve el ID del recurso asociado. Falla si el token no es válido.';


-- 6) VISTAS DE APOYO (resolución de rol-usuario)
CREATE OR REPLACE VIEW public.v_portal_identity AS
SELECT u.id AS user_id,
       COALESCE(cu.cliente_id, NULL) AS cliente_id,
       (SELECT eu.empresa_id FROM public.empresa_users eu WHERE eu.user_id = u.id LIMIT 1) AS empresa_id
FROM auth.users u
LEFT JOIN public.cliente_users cu ON cu.user_id = u.id;

COMMENT ON VIEW public.v_portal_identity IS 'Mapa rápido de user -> cliente y/o empresa para políticas del portal y lógica de negocio.';


END;
$$;

COMMIT;

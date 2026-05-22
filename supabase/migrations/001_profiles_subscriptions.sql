-- VROVEX / ShopGuard — perfiles, suscripciones y RLS

-- Perfiles vinculados a Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  plan_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (plan_status IN ('active', 'inactive', 'canceled')),
  current_period_end TIMESTAMPTZ,
  tiktok_shop_connected BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  locale TEXT NOT NULL DEFAULT 'es' CHECK (locale IN ('es', 'en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tokens TikTok Shop (cifrado recomendado con pgsodium / Vault en producción)
CREATE TABLE IF NOT EXISTS public.tiktok_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL,
  shop_name TEXT,
  region TEXT DEFAULT 'US',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, shop_id)
);

-- Métricas (ejemplo para RLS por plan activo)
CREATE TABLE IF NOT EXISTS public.shop_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_plan_status ON public.profiles(plan_status);
CREATE INDEX IF NOT EXISTS idx_tiktok_connections_user ON public.tiktok_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_metrics_user ON public.shop_metrics(user_id);

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS tiktok_connections
ALTER TABLE public.tiktok_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gestiona sus conexiones TikTok"
  ON public.tiktok_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS métricas — solo plan activo y periodo vigente
ALTER TABLE public.shop_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Métricas solo con suscripción activa"
  ON public.shop_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND plan_status = 'active'
        AND (current_period_end IS NULL OR current_period_end > NOW())
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Insertar métricas solo con plan activo"
  ON public.shop_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND plan_status = 'active'
        AND (current_period_end IS NULL OR current_period_end > NOW())
    )
    AND user_id = auth.uid()
  );

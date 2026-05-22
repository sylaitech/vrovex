# Suscripciones, Stripe y TikTok Shop

## 1. Supabase (perfiles + RLS)

Ejecuta en el SQL Editor de Supabase:

`supabase/migrations/001_profiles_subscriptions.sql`

- Tabla `profiles`: `plan_status`, `current_period_end`, `tiktok_shop_connected`
- RLS: el usuario solo ve/edita su perfil
- Métricas: solo si `plan_status = 'active'` y el periodo no venció

## 2. Stripe Billing

1. Crea producto + precio mensual en [Stripe Dashboard](https://dashboard.stripe.com).
2. Configura `server/.env`:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `FRONTEND_URL=http://localhost:5173`
3. Webhook endpoint (local con Stripe CLI):

```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

Eventos manejados:

- `checkout.session.completed` → `plan_status = active`
- `customer.subscription.updated` / `deleted`
- `invoice.payment_failed` → `inactive`

## 3. TikTok Shop OAuth (USA)

1. Registra la app en TikTok Shop Partner (United States).
2. Redirect URI: `http://localhost:5000/api/tiktok/callback`
3. Variables: `TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET`, `TIKTOK_REDIRECT_URI`
4. El botón **Conectar TikTok Shop** solo funciona con plan activo.

Flujo: usuario paga → dashboard → OAuth → tokens en MongoDB (`Shop`) + `tiktokShopConnected: true`.

## 4. Backend Express (paralelo a Supabase)

MongoDB `User` incluye los mismos campos que `profiles` para el API actual.

Rutas protegidas con `requireActivePlan`:

- `/api/metrics/*`
- `/api/appeals/*`
- `/api/compliance/*`
- `/api/shops/connect/*`

## 5. Frontend

- **EN / ES** en navbar — cambio instantáneo (`localStorage: vyshai_locale`)
- **Login / Registro** — guarda JWT en `localStorage` (`token`)
- **Panel creador** (`/admin` en la app → vista `admin`) — solo `role: creator` o `admin`

## 6. Acceso creador (sin pagar Stripe)

En `server/.env`:

```env
CREATOR_EMAILS=sylai.tech@gmail.com
```

1. Regístrate en la app con ese email → rol `creator`, plan `active` 10 años.
2. O promueve usuario existente:

```bash
cd server && node scripts/promote-creator.js tu-email@gmail.com
```

3. Inicia sesión → botón **Panel creador** en el navbar.
4. Desde el panel: ver usuarios, activar/desactivar planes 30 días, asignar rol creador.
5. **Ver dashboard (preview)** — entras al Command Center sin pagar.

- `VITE_DEMO_PLAN=active` en `.env` para probar el dashboard sin Stripe

```bash
npm run dev          # frontend :5173
cd server && npm run dev   # API :5000
```

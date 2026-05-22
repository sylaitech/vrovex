# VROVEX Backend - Migración a Supabase

## Setup Supabase

### Paso 1: Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y registrate
2. Crea un nuevo proyecto
3. Guarda estas credenciales en `server/.env`:
   - `SUPABASE_URL`: Tu URL de Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (la necesitas para el backend)
   - `SUPABASE_ANON_KEY`: Anon Key (opcional, para frontend)

### Paso 2: Crear las tablas
1. En Supabase dashboard → SQL Editor
2. Ejecuta el contenido de `supabase/migrations/001_init_schema.sql`
3. Verifica que se crearon todas las tablas

### Paso 3: Configurar .env

```bash
# Backend (.env)
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-super-secret-key
```

### Paso 4: Instalar dependencias

```bash
cd server
npm install @supabase/supabase-js
```

### Paso 5: Arrancar el backend

```bash
npm run dev
```

---

## Cambios principales de MongoDB → Supabase

### ✅ Ventajas
- ✅ Base de datos PostgreSQL (más robusta que MongoDB)
- ✅ Auth integrado con Supabase
- ✅ Row Level Security (RLS) para proteger datos
- ✅ Realtime subscriptions
- ✅ Backup automático
- ✅ Sin servidor Node.js separado necesario

### 📋 Tablas principales

#### users
- `id` (UUID) - Primary key
- `email` - Unique
- `password_hash` - Bcrypted
- `name`, `role`, `plan`, `plan_status`
- `tiktok_shop_connected`
- `stripe_customer_id`, `stripe_subscription_id`

#### shops
- `id` (UUID)
- `user_id` - FK to users
- `shop_id`, `shop_name`
- `tiktok_access_token`, `tiktok_refresh_token`
- `metrics_*` (account_health, late_dispatch_rate, etc)
- `status` (healthy, warning, critical, suspended)

#### metrics_history
- Histórico de métricas por tienda
- Usado para gráficos y tendencias

#### alerts
- `shop_id` - FK
- `alert_type` - Tipo de alerta
- `severity` - info, warning, critical
- `is_read`

#### appeals
- `shop_id` - FK
- `status` - draft, submitted, approved, rejected
- `reason`, `evidence`, `response`

---

## Próximos pasos

1. **Reescribir rutas de shops** → usar `supabase.from('shops')`
2. **Reescribir rutas de metrics** → usar `supabase.from('metrics_history')`
3. **Reescribir rutas de alerts** → usar `supabase.from('alerts')`
4. **Reescribir rutas de appeals** → usar `supabase.from('appeals')`
5. **Deploy en Vercel** con las credenciales de Supabase

---

## Debug

```bash
# Probar conexión a Supabase
curl http://localhost:5000/health

# Ver logs
npm run dev

# Verificar tablas en Supabase dashboard
# SQL Editor → Ver todas las tablas
```

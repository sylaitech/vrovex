/**
 * Genera el SQL para crear tabla users e insertar/actualizar cuenta creator.
 * Usage: node scripts/gen-creator-sql.js <email> <password>
 */
import bcrypt from 'bcryptjs';

const email = process.argv[2]?.toLowerCase().trim();
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/gen-creator-sql.js <email> <password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const farFuture = new Date();
farFuture.setFullYear(farFuture.getFullYear() + 10);

console.log(`
-- =====================================================
-- PEGAR EN: Supabase Dashboard → SQL Editor → Run
-- =====================================================

-- 1. Crear tabla users si no existe
create table if not exists public.users (
  id                      uuid primary key default gen_random_uuid(),
  email                   text unique not null,
  password_hash           text not null,
  name                    text,
  role                    text not null default 'user',
  plan_status             text not null default 'inactive',
  current_period_end      timestamptz,
  tiktok_shop_connected   boolean default false,
  email_verified          boolean default true,
  locale                  text default 'es',
  last_login              timestamptz,
  reset_password_token    text,
  reset_password_expires  timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- 2. Insertar o actualizar cuenta creator
insert into public.users (email, password_hash, name, role, plan_status, current_period_end, email_verified)
values (
  '${email}',
  '${hash}',
  'Creator',
  'creator',
  'active',
  '${farFuture.toISOString()}',
  true
)
on conflict (email) do update set
  password_hash      = excluded.password_hash,
  role               = 'creator',
  plan_status        = 'active',
  current_period_end = excluded.current_period_end;

-- 3. Verificar resultado
select id, email, role, plan_status from public.users where email = '${email}';
`);

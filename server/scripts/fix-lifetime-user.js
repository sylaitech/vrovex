/**
 * Creates or updates a lifetime free user (role: user, plan: active forever).
 * Usage: node scripts/fix-lifetime-user.js <email> <password>
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const email = process.argv[2]?.toLowerCase().trim();
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/fix-lifetime-user.js <email> <password>');
  process.exit(1);
}

const farFuture = new Date();
farFuture.setFullYear(farFuture.getFullYear() + 10);

const passwordHash = await bcrypt.hash(password, 12);

const { data: existing } = await supabase
  .from('users').select('id, email, role').eq('email', email).single();

if (existing) {
  console.log(`Usuario encontrado: ${existing.email} (rol actual: ${existing.role})`);
  const { error } = await supabase.from('users').update({
    password_hash: passwordHash,
    plan_status: 'active',
    current_period_end: farFuture.toISOString(),
    email_verified: true,
  }).eq('email', email);
  if (error) { console.error('Error:', error.message); process.exit(1); }
  console.log('Cuenta actualizada: plan=active vitalicio, password actualizado.');
} else {
  console.log(`Creando cuenta lifetime para ${email}...`);
  const { error } = await supabase.from('users').insert({
    email,
    password_hash: passwordHash,
    name: 'Usuario Lifetime',
    role: 'user',
    plan_status: 'active',
    current_period_end: farFuture.toISOString(),
    email_verified: true,
    locale: 'es',
  });
  if (error) { console.error('Error:', error.message); process.exit(1); }
  console.log('Cuenta lifetime creada.');
}

console.log('Listo. Ya puede iniciar sesion.');

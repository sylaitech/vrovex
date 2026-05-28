/**
 * Fix or create creator account in Supabase.
 * Usage: node scripts/fix-creator.js <email> <password>
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const email = process.argv[2]?.toLowerCase().trim();
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/fix-creator.js <email> <password>');
  process.exit(1);
}

const farFuture = new Date();
farFuture.setFullYear(farFuture.getFullYear() + 10);

const passwordHash = await bcrypt.hash(password, 10);

// Check if user exists
const { data: existing } = await supabase
  .from('users')
  .select('id, email, role')
  .eq('email', email)
  .single();

if (existing) {
  console.log(`Usuario encontrado: ${existing.email} (rol actual: ${existing.role})`);
  const { error } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      role: 'creator',
      plan_status: 'active',
      current_period_end: farFuture.toISOString(),
    })
    .eq('email', email);

  if (error) {
    console.error('Error al actualizar:', error.message);
    process.exit(1);
  }
  console.log('Cuenta actualizada: rol=creator, plan=active, password actualizado.');
} else {
  console.log(`Usuario no encontrado, creando cuenta creator para ${email}...`);
  const { error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      name: 'Creator',
      role: 'creator',
      plan_status: 'active',
      current_period_end: farFuture.toISOString(),
      email_verified: true,
      locale: 'es',
    });

  if (error) {
    console.error('Error al crear:', error.message);
    process.exit(1);
  }
  console.log('Cuenta creator creada.');
}

console.log('Listo. Ya podés iniciar sesión.');

#!/usr/bin/env node

/**
 * Vrovex Setup Verification Script
 * Verifica que todo esté configurado correctamente
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

async function checkNodeVersion() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const major = parseInt(version.slice(1).split('.')[0]);
    
    if (major >= 18) {
      log(`${checkmark()} Node.js ${version} (OK)`, 'green');
      return true;
    } else {
      log(`${crossmark()} Node.js ${version} (Requiere v18+)`, 'red');
      return false;
    }
  } catch (error) {
    log(`${crossmark()} Node.js no encontrado`, 'red');
    return false;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`${checkmark()} ${description}`, 'green');
    return true;
  } else {
    log(`${crossmark()} ${description} no encontrado`, 'red');
    return false;
  }
}

function checkEnvFile() {
  const envPath = path.join('server', '.env');
  
  if (!fs.existsSync(envPath)) {
    log(`${crossmark()} server/.env no encontrado`, 'red');
    log('  Ejecutar: cp server/.env.example server/.env', 'yellow');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'TIKTOK_APP_KEY',
    'TIKTOK_APP_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    return !regex.test(envContent);
  });
  
  if (missingVars.length > 0) {
    log(`${crossmark()} Variables faltantes en .env:`, 'red');
    missingVars.forEach(v => log(`  - ${v}`, 'yellow'));
    return false;
  }
  
  log(`${checkmark()} server/.env configurado`, 'green');
  return true;
}

async function checkDependencies(dir, name) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log(`${crossmark()} Dependencias de ${name} no instaladas`, 'red');
    log(`  Ejecutar: cd ${dir} && npm install`, 'yellow');
    return false;
  }
  
  log(`${checkmark()} Dependencias de ${name} instaladas`, 'green');
  return true;
}

async function checkPort(port, service) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    if (stdout.trim()) {
      log(`${crossmark()} Puerto ${port} (${service}) está ocupado`, 'red');
      return false;
    }
  } catch (error) {
    // Puerto libre (netstat no encontró nada)
  }
  
  log(`${checkmark()} Puerto ${port} (${service}) disponible`, 'green');
  return true;
}

async function main() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   Vrovex - Verificación de Setup   ║', 'cyan');
  log('╚════════════════════════════════════════╝\n', 'cyan');
  
  let allChecks = true;
  
  // 1. Node.js
  log('📦 Verificando Node.js...', 'blue');
  allChecks = await checkNodeVersion() && allChecks;
  
  // 2. Archivos del proyecto
  log('\n📁 Verificando estructura del proyecto...', 'blue');
  allChecks = checkFile('server/server.js', 'Backend server.js') && allChecks;
  allChecks = checkFile('server/package.json', 'Backend package.json') && allChecks;
  allChecks = checkFile('src/App.jsx', 'Frontend App.jsx') && allChecks;
  allChecks = checkFile('package.json', 'Frontend package.json') && allChecks;
  
  // 4. Configuración
  log('\n⚙️  Verificando configuración...', 'blue');
  allChecks = checkEnvFile() && allChecks;
  
  // 5. Dependencias
  log('\n📚 Verificando dependencias...', 'blue');
  allChecks = await checkDependencies('.', 'Frontend') && allChecks;
  allChecks = await checkDependencies('server', 'Backend') && allChecks;
  
  // 6. Puertos
  log('\n🔌 Verificando puertos...', 'blue');
  allChecks = await checkPort(5000, 'Backend') && allChecks;
  allChecks = await checkPort(5174, 'Frontend') && allChecks;
  
  // Resumen
  log('\n' + '═'.repeat(50), 'cyan');
  
  if (allChecks) {
    log('\n🎉 ¡TODO LISTO! El sistema está correctamente configurado.', 'green');
    log('\nPróximos pasos:', 'cyan');
    log('  1. Iniciar backend:  cd server && npm run dev', 'yellow');
    log('  2. Iniciar frontend: npm run dev', 'yellow');
    log('  3. Abrir navegador: http://localhost:5174/', 'yellow');
  } else {
    log('\n⚠️  Hay problemas que necesitan ser resueltos.', 'red');
    log('\nRevisa los errores marcados con ✗ arriba.', 'yellow');
    log('Consulta SETUP.md para instrucciones detalladas.', 'yellow');
  }
  
  log('\n' + '═'.repeat(50) + '\n', 'cyan');
}

main().catch(console.error);


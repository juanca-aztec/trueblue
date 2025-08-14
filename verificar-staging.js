#!/usr/bin/env node

/**
 * Script para verificar que staging esté listo para Vercel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Función principal de verificación
function main() {
  logInfo('🔍 VERIFICANDO STAGING PARA VERCEL...\n');

  let allChecksPassed = true;

  // 1. Verificar que estés en la rama staging
  try {
    const gitHead = fs.readFileSync('.git/HEAD', 'utf8').trim();
    const currentBranch = gitHead.replace('ref: refs/heads/', '');
    
    if (currentBranch === 'staging') {
      logSuccess(`Rama actual: ${currentBranch}`);
    } else {
      logError(`Debes estar en la rama 'staging', actualmente estás en '${currentBranch}'`);
      logWarning('Ejecuta: git checkout staging');
      allChecksPassed = false;
    }
  } catch (error) {
    logError('No se pudo detectar la rama actual');
    allChecksPassed = false;
  }

  // 2. Verificar que existe el script build:staging
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts['build:staging']) {
      logSuccess('Script build:staging existe en package.json');
    } else {
      logError('Script build:staging NO existe en package.json');
      allChecksPassed = false;
    }
  } catch (error) {
    logError('No se pudo leer package.json');
    allChecksPassed = false;
  }

  // 3. Verificar que existe la plantilla de staging
  const stagingTemplatePath = path.join(__dirname, 'env-templates', 'env.staging.template');
  if (fs.existsSync(stagingTemplatePath)) {
    logSuccess('Plantilla de staging existe');
  } else {
    logError('Plantilla de staging NO existe');
    allChecksPassed = false;
  }

  // 4. Verificar que existe el script setup-env.js
  const setupEnvPath = path.join(__dirname, 'scripts', 'setup-env.js');
  if (fs.existsSync(setupEnvPath)) {
    logSuccess('Script setup-env.js existe');
  } else {
    logError('Script setup-env.js NO existe');
    allChecksPassed = false;
  }

  // 5. Verificar que existe vercel.json
  const vercelPath = path.join(__dirname, 'vercel.json');
  if (fs.existsSync(vercelPath)) {
    logSuccess('Archivo vercel.json existe');
  } else {
    logError('Archivo vercel.json NO existe');
    allChecksPassed = false;
  }

  // 6. Verificar que existe .env (configuración actual)
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    logSuccess('Archivo .env existe');
    
    // Verificar contenido
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VITE_ENVIRONMENT=STAGING')) {
      logSuccess('Entorno configurado como STAGING');
    } else {
      logWarning('Verificar que .env tenga VITE_ENVIRONMENT=STAGING');
    }
  } else {
    logWarning('Archivo .env no existe, se creará con npm run env:staging');
  }

  console.log('\n' + '='.repeat(50));

  if (allChecksPassed) {
    logSuccess('🎉 ¡STAGING ESTÁ LISTO PARA VERCEL!');
    logInfo('\n📋 PRÓXIMOS PASOS:');
    logInfo('1. En Vercel, expandir "Build and Output Settings"');
    logInfo('2. Build Command: npm run build:staging');
    logInfo('3. Output Directory: dist');
    logInfo('4. Expandir "Environment Variables" y agregar las variables');
    logInfo('5. Hacer clic en "Deploy"');
    logInfo('6. Después configurar ramas en Settings → Git');
  } else {
    logError('❌ STAGING NO ESTÁ LISTO. Corrige los errores antes de continuar.');
    logInfo('\n🔧 COMANDOS PARA CORREGIR:');
    logInfo('git checkout staging');
    logInfo('npm run env:staging');
    logInfo('git add .');
    logInfo('git commit -m "Configuración para Vercel"');
    logInfo('git push origin staging');
  }

  console.log('\n' + '='.repeat(50));
}

// Ejecutar script
main();

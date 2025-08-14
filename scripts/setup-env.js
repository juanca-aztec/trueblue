#!/usr/bin/env node

/**
 * Script para configurar automáticamente el entorno según la rama actual
 * Uso: node scripts/setup-env.js [local|staging|production]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Función principal
function main() {
  const args = process.argv.slice(2);
  let targetEnv = args[0];

  // Si no se especifica entorno, detectar por rama actual
  if (!targetEnv) {
    try {
      const gitHead = fs.readFileSync('.git/HEAD', 'utf8').trim();
      const currentBranch = gitHead.replace('ref: refs/heads/', '');
      
      logInfo(`Rama actual detectada: ${currentBranch}`);
      
      if (currentBranch === 'trueblue_juanca_local') {
        targetEnv = 'local';
      } else if (currentBranch === 'staging') {
        targetEnv = 'staging';
      } else if (currentBranch === 'main') {
        targetEnv = 'production';
      } else {
        logWarning(`Rama '${currentBranch}' no reconocida. Usando entorno local por defecto.`);
        targetEnv = 'local';
      }
    } catch (error) {
      logWarning('No se pudo detectar la rama actual. Usando entorno local por defecto.');
      targetEnv = 'local';
    }
  }

  // Validar entorno
  const validEnvs = ['local', 'staging', 'production'];
  if (!validEnvs.includes(targetEnv)) {
    logError(`Entorno '${targetEnv}' no válido. Entornos válidos: ${validEnvs.join(', ')}`);
    process.exit(1);
  }

  logInfo(`Configurando entorno: ${targetEnv.toUpperCase()}`);

  // Rutas de archivos
  const templatePath = path.join(__dirname, '..', 'env-templates', `env.${targetEnv}.template`);
  const targetPath = path.join(__dirname, '..', '.env');

  // Verificar si existe la plantilla
  if (!fs.existsSync(templatePath)) {
    logError(`Plantilla de entorno '${targetEnv}' no encontrada en: ${templatePath}`);
    process.exit(1);
  }

  try {
    // Leer plantilla
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Crear archivo .env
    fs.writeFileSync(targetPath, template);
    
    logSuccess(`Entorno '${targetEnv.toUpperCase()}' configurado exitosamente!`);
    logInfo(`Archivo .env creado en: ${targetPath}`);
    
    // Mostrar configuración actual
    logInfo('Configuración actual:');
    const lines = template.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    lines.forEach(line => {
      if (line.includes('=')) {
        const [key, value] = line.split('=');
        if (key && value) {
          log(`  ${key}=${value.substring(0, 20)}...`, 'cyan');
        }
      }
    });
    
    // Recordatorios importantes
    logWarning('Recordatorios importantes:');
    log('  • Verifica que las credenciales de Telegram estén configuradas', 'yellow');
    log('  • Configura los webhooks de N8N para este entorno', 'yellow');
    log('  • Asegúrate de que la base de datos esté sincronizada', 'yellow');
    
  } catch (error) {
    logError(`Error al configurar el entorno: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar script
main();

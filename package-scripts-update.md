# 📦 Actualización del package.json - Scripts de Entorno

Este archivo contiene la actualización sugerida para el `package.json` con scripts útiles para manejar diferentes entornos.

## 🔧 Scripts a Agregar

Agrega estos scripts en la sección `"scripts"` de tu `package.json`:

```json
{
  "scripts": {
    "dev": "vite --port 5173",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    
    // ===== NUEVOS SCRIPTS DE ENTORNO =====
    "env:local": "node scripts/setup-env.js local",
    "env:staging": "node scripts/setup-env.js staging",
    "env:production": "node scripts/setup-env.js production",
    "env:auto": "node scripts/setup-env.js",
    "env:check": "cat .env | grep VITE_",
    
    // ===== SCRIPTS DE DESARROLLO =====
    "dev:local": "npm run env:local && npm run dev",
    "dev:staging": "npm run env:staging && npm run dev",
    "dev:production": "npm run env:production && npm run dev",
    
    // ===== SCRIPTS DE BUILD =====
    "build:staging": "npm run env:staging && npm run build",
    "build:production": "npm run env:production && npm run build",
    
    // ===== SCRIPTS DE SUPABASE =====
    "supabase:local": "npm run env:local && supabase status",
    "supabase:staging": "npm run env:staging && supabase status",
    "supabase:production": "npm run env:production && supabase status",
    
    // ===== SCRIPTS DE DESPLIEGUE =====
    "deploy:staging": "npm run build:staging",
    "deploy:production": "npm run build:production",
    
    // ===== SCRIPTS DE VERIFICACIÓN =====
    "check:env": "node -e \"console.log('Entorno actual:', process.env.VITE_ENVIRONMENT || 'No configurado')\"",
    "check:db": "node -e \"console.log('BD URL:', process.env.VITE_SUPABASE_URL || 'No configurado')\""
  }
}
```

## 🚀 Cómo usar los nuevos scripts:

### **Configuración rápida de entornos:**
```bash
# Configurar entorno local
npm run env:local

# Configurar entorno staging
npm run env:staging

# Configurar entorno producción
npm run env:production

# Configuración automática según la rama
npm run env:auto
```

### **Desarrollo con entorno configurado:**
```bash
# Desarrollar en local
npm run dev:local

# Desarrollar en staging
npm run dev:staging

# Desarrollar en producción
npm run dev:production
```

### **Build con entorno configurado:**
```bash
# Build para staging
npm run build:staging

# Build para producción
npm run build:production
```

### **Verificación de configuración:**
```bash
# Verificar entorno actual
npm run check:env

# Verificar configuración de BD
npm run check:db

# Ver todas las variables de entorno
npm run env:check
```

## 📋 Scripts recomendados por flujo:

### **Flujo LOCAL → STAGING:**
```bash
# 1. Desarrollar en local
npm run dev:local

# 2. Preparar para staging
npm run env:staging
npm run build:staging

# 3. Probar en staging
npm run dev:staging
```

### **Flujo STAGING → PRODUCCIÓN:**
```bash
# 1. Probar en staging
npm run dev:staging

# 2. Preparar para producción
npm run env:production
npm run build:production

# 3. Desplegar a producción
npm run deploy:production
```

## ⚠️ Notas importantes:

1. **Ejecuta siempre** `npm run env:[entorno]` antes de `npm run dev` o `npm run build`
2. **Verifica la configuración** con `npm run env:check` antes de ejecutar
3. **Los scripts de entorno** solo funcionan si tienes Node.js instalado
4. **Mantén actualizadas** las plantillas en `env-templates/`

## 🔍 Troubleshooting:

### **Error: "node scripts/setup-env.js not found"**
```bash
# Verifica que el directorio scripts existe
ls -la scripts/

# Si no existe, crea el directorio y archivo
mkdir scripts
# Copia el contenido del archivo setup-env.js
```

### **Error: "env-templates not found"**
```bash
# Verifica que el directorio env-templates existe
ls -la env-templates/

# Si no existe, crea el directorio y archivos
mkdir env-templates
# Copia las plantillas de entorno
```

---
**Para aplicar estos cambios:**
1. Copia los scripts en tu `package.json`
2. Ejecuta `npm install` para verificar que todo esté bien
3. Prueba los scripts con `npm run env:local`

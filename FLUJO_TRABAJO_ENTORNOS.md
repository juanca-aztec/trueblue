# 🔄 Flujo de Trabajo entre Entornos

Este documento describe el flujo de trabajo para manejar los diferentes entornos del proyecto TrueBlue Chat Management.

## 🌍 Entornos Disponibles

### 1. **LOCAL** (`trueblue_juanca_local`)
- **Base de datos**: Supabase personal
- **URL**: `https://avkpygwhymnxotwqzknz.supabase.co`
- **Propósito**: Desarrollo y pruebas locales
- **Configuración**: `.env.local`

### 2. **STAGING** (`staging`)
- **Base de datos**: Rama staging del Supabase de producción
- **URL**: `https://xmxmygsaogvbiemuzarm.supabase.co`
- **Propósito**: Pruebas antes de producción
- **Configuración**: `.env.staging`

### 3. **PRODUCCIÓN** (`main`)
- **Base de datos**: Rama main del Supabase de producción
- **URL**: `https://xmxmygsaogvbiemuzarm.supabase.co`
- **Propósito**: Aplicación en producción
- **Configuración**: `.env.production`

## 🚀 Flujo de Trabajo Recomendado

```
LOCAL → STAGING → PRODUCCIÓN
  ↓        ↓         ↓
.env.local → .env.staging → .env.production
```

### **Paso 1: Desarrollo Local**
```bash
# Asegúrate de estar en la rama local
git checkout trueblue_juanca_local

# Configura el entorno local
node scripts/setup-env.js local

# Desarrolla y prueba tus cambios
npm run dev
```

### **Paso 2: Preparar para Staging**
```bash
# Crea una rama de staging desde main
git checkout main
git pull origin main
git checkout -b staging

# Aplica tus cambios de la rama local
git merge trueblue_juanca_local

# Configura el entorno de staging
node scripts/setup-env.js staging

# Prueba en staging
npm run dev
```

### **Paso 3: Desplegar a Producción**
```bash
# Una vez probado en staging, merge a main
git checkout main
git merge staging

# Configura el entorno de producción
node scripts/setup-env.js production

# Despliega a producción
npm run build
```

## 🔧 Comandos Útiles

### **Configurar entorno automáticamente:**
```bash
# Detecta automáticamente según la rama actual
node scripts/setup-env.js

# O especifica manualmente
node scripts/setup-env.js local
node scripts/setup-env.js staging
node scripts/setup-env.js production
```

### **Verificar configuración actual:**
```bash
# Ver variables de entorno activas
cat .env | grep VITE_
```

### **Cambiar entre entornos rápidamente:**
```bash
# Para desarrollo local
cp env-templates/.env.local .env

# Para staging
cp env-templates/.env.staging .env

# Para producción
cp env-templates/.env.production .env
```

## 📋 Checklist antes de cada despliegue

### **Antes de ir a STAGING:**
- [ ] Funciona correctamente en LOCAL
- [ ] Todas las migraciones están aplicadas en LOCAL
- [ ] Las funciones Edge están desplegadas en LOCAL
- [ ] Los webhooks de N8N están configurados para LOCAL

### **Antes de ir a PRODUCCIÓN:**
- [ ] Funciona correctamente en STAGING
- [ ] Base de datos STAGING está sincronizada
- [ ] Funciones Edge están desplegadas en STAGING
- [ ] Webhooks de N8N están configurados para STAGING
- [ ] Pruebas de integración completadas

## 🚨 Consideraciones Importantes

### **Base de Datos:**
- **LOCAL**: Tu Supabase personal (puedes hacer cambios libremente)
- **STAGING**: Rama staging del Supabase de producción (cuidado con cambios)
- **PRODUCCIÓN**: Rama main del Supabase de producción (solo cambios críticos)

### **Webhooks y N8N:**
- Cada entorno debe tener URLs de webhook diferentes
- Configura flujos separados en N8N para cada entorno
- Usa tokens de Telegram diferentes para cada entorno

### **Variables de Entorno:**
- **NUNCA** subas archivos `.env` al repositorio
- Mantén las plantillas actualizadas en `env-templates/`
- Usa el script `setup-env.js` para cambios automáticos

## 🔍 Troubleshooting

### **Problema: Variables de entorno no se cargan**
```bash
# Verifica que el archivo .env existe
ls -la .env

# Recrea el archivo desde la plantilla
node scripts/setup-env.js [entorno]
```

### **Problema: Base de datos no conecta**
```bash
# Verifica las credenciales en .env
cat .env | grep VITE_SUPABASE

# Confirma que la URL y key son correctas
# Verifica en Supabase Dashboard
```

### **Problema: Webhooks no funcionan**
```bash
# Verifica la URL del webhook en .env
cat .env | grep VITE_N8N_WEBHOOK_URL

# Confirma que N8N está configurado para este entorno
# Verifica que el token de Telegram es correcto
```

## 📞 Soporte

Si encuentras problemas:
1. Verifica la configuración del entorno actual
2. Revisa los logs de la aplicación
3. Confirma la conectividad con Supabase
4. Verifica la configuración de N8N
5. Consulta la documentación específica del problema

---
**Última actualización**: 14/08/2025  
**Versión**: v1.1.0-20250814

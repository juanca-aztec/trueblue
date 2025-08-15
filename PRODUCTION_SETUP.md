# Configuración de Producción - TrueBlue Chat Management

## Entornos de Despliegue

### 1. Staging (Preview)
- **Rama**: `staging`
- **URL**: `https://tu-app-staging.vercel.app`
- **Propósito**: Testing y validación antes de producción
- **Variables de Entorno**: Staging (Supabase + n8n)

### 2. Producción
- **Rama**: `main`
- **URL**: `https://tu-app-prod.vercel.app`
- **Propósito**: Aplicación en vivo para usuarios finales
- **Variables de Entorno**: Producción (Supabase + n8n)

## Configuración de Variables de Entorno en Vercel

### Variables para Staging (Preview)
```
VITE_SUPABASE_URL=https://tu-proyecto-staging.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_staging
VITE_APP_ENV=staging
VITE_ENVIRONMENT=STAGING
VITE_N8N_WEBHOOK_URL=https://tu-webhook-staging.n8n.cloud/webhook/tu-id
```

### Variables para Producción
```
VITE_SUPABASE_URL=https://tu-proyecto-prod.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_prod
VITE_APP_ENV=production
VITE_ENVIRONMENT=PRODUCTION
VITE_N8N_WEBHOOK_URL=https://tu-webhook-prod.n8n.cloud/webhook/tu-id
```

## Configuración de Supabase

### 1. Proyecto de Staging
- **URL**: `https://tu-proyecto-staging.supabase.co`
- **Database**: Base de datos separada para testing
- **RLS Policies**: Configuradas para staging
- **API Keys**: Solo `anon_key` (nunca `service_role`)

### 2. Proyecto de Producción
- **URL**: `https://tu-proyecto-prod.supabase.co`
- **Database**: Base de datos de producción
- **RLS Policies**: Configuradas para producción
- **API Keys**: Solo `anon_key` (nunca `service_role`)

### 3. Configuración de CORS
Para cada proyecto de Supabase, configurar en Settings > API:

**Staging:**
```
https://tu-app-staging.vercel.app
http://localhost:5173
```

**Producción:**
```
https://tu-app-prod.vercel.app
```

## Configuración de n8n

### 1. Webhook de Staging
- **URL**: `https://tu-webhook-staging.n8n.cloud/webhook/tu-id`
- **Workflow**: Configurado para entorno de staging
- **Variables**: Usar credenciales de staging

### 2. Webhook de Producción
- **URL**: `https://tu-webhook-prod.n8n.cloud/webhook/tu-id`
- **Workflow**: Configurado para entorno de producción
- **Variables**: Usar credenciales de producción

## Flujo de Despliegue

### 1. Despliegue a Staging
```bash
# Después de merge a staging
git checkout staging
git pull origin staging
git push origin staging

# Vercel despliega automáticamente
# URL: https://tu-app-staging.vercel.app
```

### 2. Testing en Staging
- ✅ Verificar conexión a Supabase
- ✅ Verificar webhooks de n8n
- ✅ Testing de funcionalidades principales
- ✅ Verificar variables de entorno
- ✅ Testing de UI/UX

### 3. Despliegue a Producción
```bash
# Solo después de testing exitoso en staging
git checkout main
git pull origin main
git merge staging
git push origin main

# Vercel despliega automáticamente
# URL: https://tu-app-prod.vercel.app
```

## Monitoreo y Logs

### 1. Vercel Analytics
- Habilitar en Settings > Analytics
- Monitorear rendimiento y errores
- Configurar alertas para errores críticos

### 2. Supabase Logs
- Revisar logs de autenticación
- Monitorear consultas de base de datos
- Verificar políticas RLS

### 3. n8n Logs
- Monitorear ejecución de workflows
- Verificar webhooks recibidos
- Alertas para fallos de webhook

## Seguridad

### 1. Variables de Entorno
- ✅ NUNCA hardcodear en el código
- ✅ Usar solo `anon_key` de Supabase
- ✅ Rotar claves regularmente
- ✅ Acceso limitado a variables de producción

### 2. Políticas RLS
- ✅ Configurar correctamente en Supabase
- ✅ Testing de políticas en staging
- ✅ Verificar que usuarios no puedan acceder a datos de otros
- ✅ Logs de auditoría habilitados

### 3. CORS
- ✅ Configurar solo orígenes permitidos
- ✅ No usar `*` en producción
- ✅ Verificar configuración en ambos entornos

## Rollback y Emergencias

### 1. Rollback Rápido
```bash
# Si hay problemas en producción
git checkout main
git reset --hard HEAD~1
git push origin main --force

# Vercel redeploy automáticamente
```

### 2. Despliegue de Hotfix
```bash
# Crear rama de hotfix desde main
git checkout main
git checkout -b hotfix/emergency-fix

# Aplicar fix
git add .
git commit -m "hotfix: emergency fix description"

# Merge directo a main (bypass staging)
git checkout main
git merge hotfix/emergency-fix
git push origin main

# Después, merge a staging
git checkout staging
git merge main
git push origin staging
```

## Verificación Post-Despliegue

### Checklist de Producción
- [ ] Aplicación accesible en URL de producción
- [ ] Variables de entorno cargadas correctamente
- [ ] Conexión a Supabase funcionando
- [ ] Webhooks de n8n respondiendo
- [ ] Funcionalidades principales operativas
- [ ] No hay errores en consola del navegador
- [ ] Performance aceptable
- [ ] Logs sin errores críticos

### Checklist de Staging
- [ ] Aplicación accesible en URL de staging
- [ ] Variables de entorno de staging cargadas
- [ ] Conexión a Supabase staging funcionando
- [ ] Webhooks de n8n staging respondiendo
- [ ] Testing completo de funcionalidades
- [ ] Listo para merge a producción


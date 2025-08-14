# 🌍 Plantillas de Configuración por Entorno

Este directorio contiene las plantillas de configuración para cada entorno del proyecto.

## 📁 Archivos de Entorno

### 1. `.env.local` - Entorno Local (Desarrollo)
```bash
# ========================================
# ENTORNO LOCAL - Supabase Personal
# ========================================

# Supabase Configuration
VITE_SUPABASE_URL=https://avkpygwhymnxotwqzknz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3B5Z3doeW1ueG90d3F6a256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjEyMDcsImV4cCI6MjA2ODg5NzIwN30.p97K1S3WYNAeYb-ExRpRp3J_pqFegFJ11VOe5th_xHk
VITE_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3B5Z3doeW1ueG90d3F6a256Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMyMTIwNywiZXhwIjoyMDY4ODk3MjA3fQ.YIiEGciwgWJ7aqxWZAHV-bcaCWvaKfALcxsYR1H2Eu4

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_ENV=local

# Telegram Configuration
VITE_TELEGRAM_BOT_TOKEN=your_local_telegram_token

# N8N Webhook Configuration
VITE_N8N_WEBHOOK_URL=https://aztec.app.n8n.cloud/webhook/feb40c09-7947-4523-a263-9647125a03ec

# Environment Identifier
VITE_ENVIRONMENT=LOCAL
```

### 2. `.env.staging` - Entorno Staging
```bash
# ========================================
# ENTORNO STAGING - Supabase Producción (Rama Staging)
# ========================================

# Supabase Configuration
VITE_SUPABASE_URL=https://xmxmygsaogvbiemuzarm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteG15Z3Nhb2d2YmllbXV6YXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDY1MzEsImV4cCI6MjA2OTM4MjUzMX0.V_vK9YiY01U2EwqS7Aw57NeR64T36IQaPr7Z1sdT_Pg
VITE_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteG15Z3Nhb2d2YmllbXV6YXJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgwNjUzMSwiZXhwIjoyMDY5MzgyNTMxfQ.q86DpJg__UcIqdjZwEXu01ZCCSGf6tdNEjth6vKsK1Q

# App Configuration
VITE_APP_URL=https://staging.trueblue.azteclab.co
VITE_APP_ENV=staging

# Telegram Configuration
VITE_TELEGRAM_BOT_TOKEN=your_staging_telegram_token

# N8N Webhook Configuration
VITE_N8N_WEBHOOK_URL=https://aztec.app.n8n.cloud/webhook/47e8e9ed-a639-4853-b8a5-e24cb5aff9c1

# Environment Identifier
VITE_ENVIRONMENT=STAGING
```

### 3. `.env.production` - Entorno Producción
```bash
# ========================================
# ENTORNO PRODUCCIÓN - Supabase Producción (Rama Main)
# ========================================

# Supabase Configuration
VITE_SUPABASE_URL=https://xmxmygsaogvbiemuzarm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteG15Z3Nhb2d2YmllbXV6YXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDY1MzEsImV4cCI6MjA2OTM4MjUzMX0.V_vK9YiY01U2EwqS7Aw57NeR64T36IQaPr7Z1sdT_Pg
VITE_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteG15Z3Nhb2d2YmllbXV6YXJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgwNjUzMSwiZXhwIjoyMDY5MzgyNTMxfQ.q86DpJg__UcIqdjZwEXu01ZCCSGf6tdNEjth6vKsK1Q

# App Configuration
VITE_APP_URL=https://trueblue.azteclab.co
VITE_APP_ENV=production

# Telegram Configuration
VITE_TELEGRAM_BOT_TOKEN=your_production_telegram_token

# N8N Webhook Configuration
VITE_N8N_WEBHOOK_URL=https://aztec.app.n8n.cloud/webhook/c73f8e50-8c4-4e64-9515-371c99cd0f07

# Environment Identifier
VITE_ENVIRONMENT=PRODUCTION
```

## 🚀 Cómo usar estas plantillas:

### Para desarrollo local:
```bash
cp env-templates/.env.local .env
```

### Para staging:
```bash
cp env-templates/.env.staging .env
```

### Para producción:
```bash
cp env-templates/.env.production .env
```

## ⚠️ Importante:
- **NUNCA** subas archivos `.env` al repositorio
- Mantén las credenciales seguras
- Usa tokens diferentes para cada entorno
- Configura webhooks de N8N específicos para cada entorno

## 🔧 Configuración por rama:
- **Rama `trueblue_juanca_local`**: Usar `.env.local`
- **Rama `staging`**: Usar `.env.staging`
- **Rama `main`**: Usar `.env.production`

## 🌐 Webhooks de N8N configurados:

### **LOCAL** (Desarrollo):
- URL: `https://aztec.app.n8n.cloud/webhook/feb40c09-7947-4523-a263-9647125a03ec`
- Propósito: Pruebas y desarrollo local

### **STAGING** (Pruebas):
- URL: `https://aztec.app.n8n.cloud/webhook/47e8e9ed-a639-4853-b8a5-e24cb5aff9c1`
- Propósito: Pruebas antes de producción

### **PRODUCCIÓN** (Live):
- URL: `https://aztec.app.n8n.cloud/webhook/c73f8e50-8c4-4e64-9515-371c99cd0f07`
- Propósito: Aplicación en producción

## 📋 Notas de configuración:

1. **Cada entorno** tiene su propio webhook de N8N
2. **Los webhooks** están configurados para la función `send-to-n8n`
3. **Verifica** que N8N esté configurado para cada entorno
4. **Prueba** los webhooks antes de usar cada entorno

# 🚨 **INSTRUCCIONES URGENTES PARA VERCEL**

## ❌ **PROBLEMA ACTUAL:**
Vercel está intentando hacer deploy desde la rama `main` (que NO tiene los scripts actualizados)

## ✅ **SOLUCIÓN INMEDIATA:**

### **1. EN VERCEL - CAMBIAR RAMA DE ORIGEN:**

#### **🔧 Ir a Settings → Git:**
- **Production Branch:** cambiar de `main` a `staging`
- **Preview Branch:** poner `trueblue_juanca_local`

#### **🔧 O en la configuración del proyecto:**
- Buscar donde dice "Branch" o "Source Branch"
- Cambiar de `main` a `staging`

### **2. CONFIGURACIÓN CORRECTA:**

#### **Build and Output Settings:**
- **Build Command:** `npm run build:staging` ✅
- **Output Directory:** `dist` ✅
- **Install Command:** `npm install --legacy-peer-deps` ✅

#### **Environment Variables:**
```
VITE_SUPABASE_URL = https://xmxmygsaogvbiemuzarm.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteG15Z3Nhb2d2YmllbXV6YXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDY1MzEsImV4cCI6MjA2OTM4MjUzMX0.V_vK9YiY01U2EwqS7Aw57NeR64T36IQaPr7Z1sdT_Pg
VITE_APP_ENV = staging
VITE_ENVIRONMENT = STAGING
VITE_N8N_WEBHOOK_URL = https://aztec.app.n8n.cloud/webhook/47e8e9ed-a639-4853-b8a5-e24cb5aff9c1
```

## 🎯 **RESULTADO ESPERADO:**

**Después de cambiar la rama a `staging`:**
- ✅ Vercel clonará la rama `staging` (que SÍ tiene los scripts)
- ✅ El comando `npm run build:staging` funcionará
- ✅ El deploy será exitoso

## 🚨 **NO HACER DEPLOY HASTA:**
1. ✅ Cambiar la rama de `main` a `staging`
2. ✅ Configurar Build Command, Output Directory e Install Command
3. ✅ Configurar Environment Variables

---
**ESTADO**: ❌ **RAM A INCORRECTA EN VERCEL**  
**SOLUCIÓN**: **CAMBIAR A RAMA `staging`**


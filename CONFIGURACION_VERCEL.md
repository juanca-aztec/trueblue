# 🚀 **CONFIGURACIÓN COMPLETA PARA VERCEL - STAGING**

## ✅ **ANTES DEL DEPLOY - CONFIGURAR EN VERCEL:**

### **1. EXPANDIR "Build and Output Settings":**
- **Haz clic en la flecha** para expandir esta sección
- **Build Command:** `npm run build:staging`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### **2. EXPANDIR "Environment Variables":**
- **Haz clic en la flecha** para expandir esta sección
- **Agregar estas variables una por una:**

```
VITE_SUPABASE_URL = https://xmxmygsaogvbiemuzarm.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteG15Z3Nhb2d2YmllbXV6YXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDY1MzEsImV4cCI6MjA2OTM4MjUzMX0.V_vK9YiY01U2EwqS7Aw57NeR64T36IQaPr7Z1sdT_Pg
VITE_APP_ENV = staging
VITE_ENVIRONMENT = STAGING
VITE_N8N_WEBHOOK_URL = https://aztec.app.n8n.cloud/webhook/47e8e9ed-a639-4853-b8a5-e24cb5aff9c1
```

### **3. HACER DEPLOY:**
- **Haz clic en "Deploy"**
- **Espera a que termine** el proceso de build

## 🔧 **DESPUÉS DEL DEPLOY - CONFIGURAR RAMAS:**

### **1. Ir a Settings → Git:**
- **Production Branch:** cambiar de `main` a `staging`
- **Preview Branch:** poner `trueblue_juanca_local`

### **2. Verificar despliegue:**
- **Staging:** Se desplegará automáticamente desde la rama `staging`
- **Preview:** Se desplegará automáticamente desde `trueblue_juanca_local`

## 🌐 **URLS FINALES:**

### **Después de configurar:**
- **Staging:** `https://[tu-proyecto].vercel.app` ✅
- **Local:** `http://localhost:5173` ✅
- **Producción:** `https://trueblue.azteclab.co` ✅

## 🚨 **IMPORTANTE:**

### **NO hacer clic en "Deploy" hasta:**
1. ✅ Configurar Build Command
2. ✅ Configurar Output Directory
3. ✅ Configurar Environment Variables

### **Después del deploy:**
1. ✅ Configurar ramas en Settings
2. ✅ Verificar que staging funcione
3. ✅ Probar la aplicación

## 📋 **CHECKLIST ANTES DEL DEPLOY:**

- [ ] Build Command: `npm run build:staging`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`
- [ ] Environment Variables configuradas
- [ ] Archivo `vercel.json` presente
- [ ] Rama staging existe en GitHub

## 🎯 **RESULTADO ESPERADO:**

### **Con esta configuración:**
- **Cada push a `staging`** → Deploy automático a staging
- **Cada push a `trueblue_juanca_local`** → Preview automático
- **Staging estará en línea** y accesible para otros
- **Producción no se verá afectada**

---
**Estado**: ✅ **CONFIGURACIÓN COMPLETA PARA VERCEL**  
**Próximo paso**: **CONFIGURAR EN VERCEL Y HACER DEPLOY**

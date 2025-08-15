# 🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO EN VERCEL

## 🚨 **ERROR ACTUAL:**
```
failed to bundle function: exit status 1
```

## 🎯 **CAUSA PROBABLE:**
**Variables de entorno faltantes o incorrectas en Vercel**

## ✅ **VARIABLES REQUERIDAS PARA PREVIEW (STAGING):**

### **Supabase Configuration:**
- `VITE_SUPABASE_URL` = `https://tu-proyecto-staging.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `tu_anon_key_staging_real`

### **App Configuration:**
- `VITE_APP_URL` = `https://tu-app-staging.vercel.app`
- `VITE_APP_ENV` = `staging`
- `VITE_ENVIRONMENT` = `STAGING`

### **n8n Configuration:**
- `VITE_N8N_WEBHOOK_URL` = `https://tu-webhook-staging.n8n.cloud/webhook/tu-id`

---

## ✅ **VARIABLES REQUERIDAS PARA PRODUCTION (MAIN):**

### **Supabase Configuration:**
- `VITE_SUPABASE_URL` = `https://tu-proyecto-prod.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `tu_anon_key_prod_real`

### **App Configuration:**
- `VITE_APP_URL` = `https://tu-app-prod.vercel.app`
- `VITE_APP_ENV` = `production`
- `VITE_ENVIRONMENT` = `PRODUCTION`

### **n8n Configuration:**
- `VITE_N8N_WEBHOOK_URL` = `https://tu-webhook-prod.n8n.cloud/webhook/tu-id`

---

## 🔧 **PASOS PARA VERIFICAR EN VERCEL:**

### **1. Ir a tu proyecto en Vercel:**
- Dashboard → Tu Proyecto → Settings → Environment Variables

### **2. Verificar Preview Environment:**
- Asegúrate de que las variables de staging estén configuradas
- Deben estar marcadas para "Preview" (staging branch)

### **3. Verificar Production Environment:**
- Asegúrate de que las variables de production estén configuradas
- Deben estar marcadas para "Production" (main branch)

### **4. Verificar que no haya variables vacías:**
- Todas las variables deben tener valores válidos
- No deben estar vacías o con valores de placeholder

---

## 🚀 **DESPUÉS DE VERIFICAR:**

1. **Hacer un pequeño cambio** en tu código
2. **Commit y push** a staging
3. **Vercel debería hacer build exitoso**

---

## ❌ **SI EL PROBLEMA PERSISTE:**

### **Verificar en Vercel:**
- Build logs completos
- Variables de entorno en el build
- Configuración del proyecto

### **Verificar localmente:**
- `npm run build` (ya funciona)
- Variables de entorno locales

---

## 🎯 **RESUMEN:**
El error de bundle se debe a variables de entorno faltantes en Vercel. Una vez configuradas correctamente, el build debería funcionar perfectamente.

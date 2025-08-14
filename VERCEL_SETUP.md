# Configuración de Vercel - TrueBlue Chat Management

## Pasos para Conectar el Repositorio a Vercel

### 1. Conectar Repositorio
1. Ve a [vercel.com](https://vercel.com) y inicia sesión
2. Haz clic en "New Project"
3. Selecciona tu repositorio de GitHub: `trueblue-chat-management`
4. Haz clic en "Import"

### 2. Configuración del Proyecto
- **Framework Preset**: Vite
- **Root Directory**: `./` (dejar por defecto)
- **Build Command**: `npm run build` (ya configurado en vercel.json)
- **Output Directory**: `dist` (ya configurado en vercel.json)
- **Install Command**: `npm install --legacy-peer-deps` (ya configurado en vercel.json)

### 3. Variables de Entorno

#### Para Preview (Staging):
```
VITE_SUPABASE_URL=https://tu-proyecto-staging.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_staging
VITE_APP_ENV=staging
VITE_ENVIRONMENT=STAGING
VITE_N8N_WEBHOOK_URL=https://tu-webhook-staging.n8n.cloud/webhook/tu-id
```

#### Para Production:
```
VITE_SUPABASE_URL=https://tu-proyecto-prod.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_prod
VITE_APP_ENV=production
VITE_ENVIRONMENT=PRODUCTION
VITE_N8N_WEBHOOK_URL=https://tu-webhook-prod.n8n.cloud/webhook/tu-id
```

### 4. Configuración de Ramas
- **Production Branch**: `main`
- **Preview Branches**: `staging` (y cualquier otra rama)

### 5. URLs de Despliegue
- **Production**: `https://tu-app-prod.vercel.app`
- **Preview (Staging)**: `https://tu-app-staging.vercel.app`
- **Preview (Features)**: `https://tu-app-feature-name.vercel.app`

### 6. Configuración de Dominios (Opcional)
- Puedes configurar dominios personalizados en Settings > Domains
- Ejemplo: `staging.tuapp.com` para staging

## Flujo de Despliegue Automático

1. **Push a `staging`** → Despliega automáticamente a Preview (staging)
2. **Push a `main`** → Despliega automáticamente a Production
3. **Push a cualquier otra rama** → Despliega automáticamente a Preview

## Verificación

Después de cada despliegue, verifica:
- Las variables de entorno están correctas
- La aplicación se conecta a Supabase correctamente
- Los webhooks de n8n funcionan
- No hay errores en la consola del navegador

## Troubleshooting

- Si hay problemas de build, revisa los logs en Vercel
- Si las variables de entorno no se cargan, verifica que estén configuradas correctamente
- Si hay problemas de CORS, verifica la configuración de Supabase

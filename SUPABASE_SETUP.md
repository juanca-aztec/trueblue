# Configuración de Supabase

## ✅ Estado Actual
Tu proyecto ya está configurado y conectado a Supabase con las siguientes credenciales:

- **URL de la API**: `https://avkpygwhymnxotwqzknz.supabase.co`
- **Clave de API (anon key)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3B5Z3doeW1ueG90d3F6a256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjEyMDcsImV4cCI6MjA2ODg5NzIwN30.p97K1S3WYNAeYb-ExRpRp3J_pqFegFJ11VOe5th_xHk`

## 🔧 Configuración Opcional de Variables de Entorno

Para mayor seguridad, puedes crear un archivo `.env` en la raíz del proyecto:

1. **Crea un archivo `.env`** en la raíz del proyecto
2. **Copia el contenido** del archivo `env.example`
3. **Personaliza los valores** según tu configuración

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://avkpygwhymnxotwqzknz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3B5Z3doeW1ueG90d3F6a256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjEyMDcsImV4cCI6MjA2ODg5NzIwN30.p97K1S3WYNAeYb-ExRpRp3J_pqFegFJ11VOe5th_xHk

# App Configuration
VITE_APP_URL=https://trueblue.azteclab.co
```

## 🚀 Funcionalidades Disponibles

Tu proyecto ya incluye:

- ✅ **Autenticación completa** con Supabase Auth
- ✅ **Gestión de perfiles** de usuarios
- ✅ **Sistema de roles** (admin, agent, ai)
- ✅ **Gestión de conversaciones** y mensajes
- ✅ **Hooks personalizados** para Supabase
- ✅ **Tipos TypeScript** completos para la base de datos

## 🧪 Prueba la Conexión

Para verificar que todo esté funcionando:

1. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Abre la consola del navegador** y busca mensajes de conexión exitosa

3. **Verifica que no haya errores** relacionados con Supabase

## 📁 Archivos Importantes

- `src/integrations/supabase/client.ts` - Cliente principal de Supabase
- `src/integrations/supabase/types.ts` - Tipos de la base de datos
- `src/hooks/useAuth.tsx` - Hook de autenticación
- `src/hooks/useConversations.tsx` - Hook para conversaciones
- `src/hooks/useAgents.tsx` - Hook para gestión de agentes

## 🔒 Seguridad

- Las credenciales están protegidas en `.gitignore`
- El cliente usa variables de entorno si están disponibles
- Fallback a credenciales hardcodeadas para desarrollo

## 📞 Soporte

Si encuentras algún problema:

1. Verifica que las credenciales sean correctas
2. Asegúrate de que la base de datos esté activa en Supabase
3. Revisa la consola del navegador para errores
4. Verifica que las tablas existan en tu base de datos





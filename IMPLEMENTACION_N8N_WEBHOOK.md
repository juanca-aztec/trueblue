# 🔄 Implementación de n8n Webhook - Cambio de Telegram Directo

## 📋 **Resumen del Cambio**

Se ha implementado un cambio en el sistema de envío de mensajes para que, en lugar de enviar directamente a Telegram, los mensajes se envíen a través de un webhook de n8n para mayor flexibilidad y control.

## 🎯 **Antes vs Después**

### **❌ ANTES (Envío Directo a Telegram):**
- Los mensajes se enviaban directamente al bot de Telegram
- Usaba la función `sendTelegramMessage` del frontend
- Limitado a la funcionalidad de Telegram

### **✅ DESPUÉS (Envío a n8n Webhook):**
- Los mensajes se envían al webhook de n8n
- n8n puede enrutar a Telegram, WhatsApp, o cualquier otro canal
- Mayor flexibilidad y control del flujo de mensajes

## 🔧 **Cambios Implementados**

### **1. Nueva Columna en Base de Datos**
```sql
-- Agregar columna channel a tb_conversations
ALTER TABLE public.tb_conversations 
ADD COLUMN channel text DEFAULT 'telegram';

-- Comentario para documentar el campo
COMMENT ON COLUMN public.tb_conversations.channel IS 'Canal de origen de la conversación (telegram, whatsapp, etc.)';
```

### **2. Nueva Edge Function: `send-to-n8n`**
- **URL del webhook**: `https://aztec.app.n8n.cloud/webhook/feb40c09-7947-4523-a263-9647125a03ec`
- **Método**: POST
- **Payload**: JSON con estructura específica

### **3. Modificación del Frontend**
- Eliminada importación de `sendTelegramMessage`
- Reemplazada por llamada a Edge Function `send-to-n8n`
- Obtiene el canal de la conversación desde la base de datos
- Incluye `chatId` (user_id de la conversación) en el payload

## 📡 **Estructura del Payload**

```json
{
  "conversationId": "uuid-de-la-conversacion",
  "message": "Contenido del mensaje del agente",
  "channel": "telegram",
  "senderId": "uuid-del-agente",
  "chatId": "uuid-del-usuario-telegram"
}
```

**Nota**: El campo `chatId` corresponde a la columna `user_id` de la tabla `tb_conversations`, que representa el identificador único del usuario en el canal de origen (Telegram, WhatsApp, etc.).

## 🚀 **Flujo de Envío Actualizado**

1. **Agente escribe mensaje** en el frontend
2. **Mensaje se guarda** en la base de datos
3. **Se obtiene el canal** de la conversación (`channel` column)
4. **Se envía al webhook de n8n** con la estructura requerida
5. **n8n procesa y enruta** el mensaje al canal correspondiente

## 📁 **Archivos Modificados**

### **Nuevos Archivos:**
- `supabase/migrations/20250813195000_add_channel_column.sql`
- `supabase/functions/send-to-n8n/index.ts`
- `IMPLEMENTACION_N8N_WEBHOOK.md`

### **Archivos Modificados:**
- `supabase/config.toml` - Agregada configuración para nueva función
- `src/hooks/useConversations.tsx` - Cambiado envío de Telegram a n8n

## ✅ **Beneficios del Cambio**

1. **Flexibilidad**: n8n puede enrutar a múltiples canales
2. **Control**: Mejor manejo de errores y logging
3. **Escalabilidad**: Fácil agregar nuevos canales de comunicación
4. **Integración**: Mejor integración con otros sistemas
5. **Mantenimiento**: Centralizado en n8n en lugar de código hardcodeado

## 🔍 **Para Probar la Implementación**

1. **Ejecutar la migración SQL** para agregar la columna `channel`
2. **Desplegar la nueva Edge Function** `send-to-n8n` en Supabase
3. **Enviar un mensaje** desde el frontend como agente
4. **Verificar en los logs** que se envía al webhook de n8n
5. **Confirmar en n8n** que recibe el payload correcto

## 📝 **Notas Importantes**

- **Conversaciones existentes**: Se les asigna `channel = 'telegram'` por defecto
- **Nuevas conversaciones**: Pueden especificar el canal al crearse
- **Fallback**: Si no hay canal especificado, se usa `'telegram'` por defecto
- **CORS**: La nueva función tiene CORS configurado correctamente

## 🚨 **Consideraciones de Seguridad**

- **Webhook URL**: Está hardcodeada en la función (considerar usar variables de entorno)
- **Verificación JWT**: Deshabilitada para la función (verificar si es necesario)
- **Rate Limiting**: Considerar implementar en n8n si es necesario

## 🔄 **Rollback en Caso de Problemas**

Si es necesario revertir el cambio:

1. **Revertir la migración SQL** (eliminar columna `channel`)
2. **Restaurar el código anterior** en `useConversations.tsx`
3. **Reimportar** `sendTelegramMessage`
4. **Eliminar la función** `send-to-n8n`

## 📊 **Estado de la Implementación**

- ✅ **Migración SQL** creada
- ✅ **Edge Function** creada
- ✅ **Frontend** modificado
- ✅ **Configuración** actualizada
- ⏳ **Despliegue** pendiente en Supabase
- ⏳ **Pruebas** pendientes

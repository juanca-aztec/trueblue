# 🔧 Solución de Problemas de Real-Time en Supabase

## 🚨 Problemas Identificados

### 1. **Mensajes nuevos no se muestran en tiempo real**
- Los mensajes llegan a la base de datos pero no se reflejan en el frontend
- Las conversaciones no se actualizan automáticamente

### 2. **Estados de conversación no se sincronizan**
- Cuando un agente responde, el estado no cambia de "pending_human" a "active_human"
- Los cambios en la base de datos no se reflejan en la interfaz

## ✅ Soluciones Implementadas

### 1. **Mejoras en los Hooks de Real-Time**

#### `useConversations.tsx`
- ✅ Implementación robusta de suscripciones de Supabase
- ✅ Actualización inmediata del estado local para mejor UX
- ✅ Manejo específico de eventos INSERT, UPDATE, DELETE
- ✅ Nombres de canales únicos para evitar conflictos
- ✅ Logs detallados para debugging

#### `useAgents.tsx`
- ✅ Soporte de real-time para cambios en perfiles
- ✅ Actualización inmediata del estado local
- ✅ Sincronización automática de agentes

### 2. **Componente de Debug**
- ✅ `RealTimeDebug.tsx` para probar funcionalidad
- ✅ Verificación de configuración de tablas
- ✅ Pruebas de inserción/eliminación en tiempo real

### 3. **Migración de Base de Datos**
- ✅ `20250813000000_fix_realtime_config.sql`
- ✅ Configuración correcta de REPLICA IDENTITY
- ✅ Adición de tablas a publicación de real-time
- ✅ Políticas RLS optimizadas para real-time

## 🧪 Cómo Probar

### 1. **Usar el Componente de Debug**
```tsx
import { RealTimeDebug } from '@/components/RealTimeDebug';

// Agregar en tu página de desarrollo
<RealTimeDebug />
```

### 2. **Verificar en la Consola**
- Abrir DevTools (F12)
- Buscar logs con emojis: 🔄, ✅, ❌, 📡
- Verificar que no haya errores de CORS o permisos

### 3. **Probar Funcionalidad**
1. Abrir dos pestañas del navegador
2. En una, enviar un mensaje
3. En la otra, verificar que aparezca automáticamente

## 🔍 Verificaciones de Configuración

### 1. **En Supabase Dashboard**
- Ir a Database → Replication
- Verificar que las tablas estén en la publicación `supabase_realtime`
- Confirmar que RLS esté habilitado

### 2. **Políticas RLS**
```sql
-- Verificar que existan estas políticas
SELECT * FROM pg_policies WHERE tablename IN ('tb_conversations', 'tb_messages', 'profiles');
```

### 3. **REPLICA IDENTITY**
```sql
-- Verificar configuración
SELECT schemaname, tablename, replica_identity 
FROM pg_tables 
WHERE tablename IN ('tb_conversations', 'tb_messages', 'profiles');
```

## 🚀 Pasos para Implementar

### 1. **Ejecutar la Migración**
```bash
# En Supabase Dashboard
# Database → Migrations → Apply migration
# Subir el archivo: 20250813000000_fix_realtime_config.sql
```

### 2. **Reiniciar la Aplicación**
```bash
npm run dev
```

### 3. **Verificar Logs**
- Buscar mensajes de suscripción exitosa
- Confirmar que no haya errores de conexión

## 🐛 Problemas Comunes y Soluciones

### 1. **Error: "Channel not found"**
**Causa**: Canal no se creó correctamente
**Solución**: Verificar que `supabase.channel()` se ejecute antes de `.subscribe()`

### 2. **Error: "Permission denied"**
**Causa**: Políticas RLS muy restrictivas
**Solución**: Verificar que las políticas permitan SELECT para real-time

### 3. **Error: "Table not in publication"**
**Causa**: Tabla no está en `supabase_realtime`
**Solución**: Ejecutar la migración de configuración

### 4. **Suscripciones no funcionan**
**Causa**: REPLICA IDENTITY no configurado
**Solución**: Verificar que las tablas tengan `REPLICA IDENTITY FULL`

## 📊 Monitoreo y Debugging

### 1. **Logs de Real-Time**
```typescript
// En los hooks, buscar estos logs:
console.log('🔄 Setting up real-time subscriptions...');
console.log('✅ Real-time subscriptions set up successfully');
console.log('📡 Channel subscription status:', status);
```

### 2. **Estado de Suscripciones**
- `SUBSCRIBED`: Funcionando correctamente
- `CHANNEL_ERROR`: Error en el canal
- `TIMED_OUT`: Timeout de conexión

### 3. **Verificar Eventos**
```typescript
// Los payloads deben tener esta estructura:
{
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  new: { /* datos nuevos */ },
  old: { /* datos anteriores */ }
}
```

## 🔧 Configuración Avanzada

### 1. **Optimización de Canales**
```typescript
// Usar nombres únicos para evitar conflictos
const channelName = `conversations-${profile.id}-${Date.now()}`;
```

### 2. **Manejo de Reconexión**
```typescript
// Implementar reconexión automática
const channel = supabase.channel(name)
  .on('disconnect', () => {
    console.log('Canal desconectado, reconectando...');
    // Lógica de reconexión
  });
```

### 3. **Filtrado de Eventos**
```typescript
// Solo escuchar eventos específicos
.on('postgres_changes', {
  event: 'INSERT', // Solo inserciones
  schema: 'public',
  table: 'tb_messages'
}, callback)
```

## 📞 Soporte

Si los problemas persisten:

1. **Verificar logs** en la consola del navegador
2. **Usar el componente de debug** para diagnóstico
3. **Revisar migraciones** en Supabase Dashboard
4. **Verificar permisos** de usuario en la base de datos
5. **Comprobar conectividad** a Supabase

## 🎯 Resultados Esperados

Después de implementar las soluciones:

- ✅ **Mensajes nuevos** aparecen automáticamente
- ✅ **Estados de conversación** se actualizan en tiempo real
- ✅ **Asignaciones de agentes** se reflejan inmediatamente
- ✅ **Cambios en perfiles** se sincronizan automáticamente
- ✅ **Logs detallados** para debugging futuro





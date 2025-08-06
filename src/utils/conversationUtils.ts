
import { ConversationWithMessages } from '@/types/database';

export function hasUnreadUserMessages(conversation: ConversationWithMessages): boolean {
  // Caso 1: Si el status es "pending_human", siempre mostrar como no leído
  if (conversation.status === 'pending_human') {
    return true;
  }
  
  // Caso 2: Verificar si el último mensaje del chat fue enviado por el usuario
  if (conversation.messages.length === 0) return false;
  
  // Obtener el último mensaje de la conversación (sin importar el sender_role)
  const lastMessage = conversation.messages
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  
  // Si el último mensaje fue enviado por un usuario, mostrar como no leído
  return lastMessage.sender_role === 'user';
}


import { ConversationWithMessages } from '@/types/database';

export function hasUnreadUserMessages(conversation: ConversationWithMessages): boolean {
  if (conversation.messages.length === 0) return false;
  
  // Encontrar el último mensaje del usuario (sender_role = 'user')
  const lastUserMessage = conversation.messages
    .filter(msg => msg.sender_role === 'user')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
  if (!lastUserMessage) return false;
  
  // Verificar si hay algún mensaje de agente después del último mensaje de usuario
  const messagesAfterLastUser = conversation.messages.filter(msg => 
    new Date(msg.created_at) > new Date(lastUserMessage.created_at) && 
    msg.sender_role === 'agent'
  );
  
  return messagesAfterLastUser.length === 0;
}

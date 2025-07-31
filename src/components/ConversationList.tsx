import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConversationWithMessages } from '@/types/database';
import { MessageSquare, User, Clock } from 'lucide-react';

interface ConversationListProps {
  conversations: ConversationWithMessages[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: ConversationWithMessages) => void;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active_ai':
        return 'bg-blue-500';
      case 'active_human':
        return 'bg-green-500';
      case 'pending_human':
        return 'bg-yellow-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active_ai':
        return 'AI Activo';
      case 'active_human':
        return 'Humano Activo';
      case 'pending_human':
        return 'Pendiente Humano';
      case 'closed':
        return 'Cerrado';
      default:
        return status;
    }
  };

  const getLastMessage = (messages: any[]) => {
    if (messages.length === 0) return 'Sin mensajes';
    const lastMessage = messages[messages.length - 1];
    return lastMessage.content.length > 50 
      ? `${lastMessage.content.substring(0, 50)}...` 
      : lastMessage.content;
  };

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className={`cursor-pointer transition-colors hover:bg-accent ${
            selectedConversationId === conversation.id ? 'bg-accent border-primary' : ''
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {conversation.username || conversation.user_id}
                </span>
              </div>
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(conversation.status)} text-white`}
              >
                {getStatusText(conversation.status)}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">
              {getLastMessage(conversation.messages)}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{conversation.messages.length} mensajes</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {(() => {
                    if (!conversation.updated_at) return 'Fecha desconocida';
                    
                    const date = new Date(conversation.updated_at);
                    if (isNaN(date.getTime())) return 'Fecha inválida';
                    
                    try {
                      return formatDistanceToNow(date, {
                        addSuffix: true,
                        locale: es,
                      });
                    } catch (error) {
                      return 'Fecha inválida';
                    }
                  })()}
                </span>
              </div>
            </div>
            
            {conversation.assigned_agent && (
              <div className="mt-2 text-xs text-muted-foreground">
                Asignado a: {conversation.assigned_agent.name}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
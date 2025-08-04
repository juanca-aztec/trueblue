import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationWithMessages, Profile, ConversationStatus } from '@/types/database';
import { Send, User, Bot, MessageSquare } from 'lucide-react';

interface ChatWindowProps {
  conversation: ConversationWithMessages;
  currentUser: Profile;
  agents: Profile[];
  onSendMessage: (conversationId: string, content: string, agentId: string) => void;
  onUpdateStatus: (conversationId: string, status: ConversationStatus) => void;
  onAssignAgent: (conversationId: string, agentId: string) => void;
}

export function ChatWindow({
  conversation,
  currentUser,
  agents,
  onSendMessage,
  onUpdateStatus,
  onAssignAgent,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    await onSendMessage(conversation.id, newMessage.trim(), currentUser.id);
    setNewMessage('');
    setSending(false);
  };

  const getSenderIcon = (senderRole: string) => {
    switch (senderRole) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'ai':
        return <Bot className="h-4 w-4" />;
      case 'agent':
      case 'human':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSenderLabel = (senderRole: string) => {
    switch (senderRole) {
      case 'user':
        return 'Usuario';
      case 'ai':
        return 'IA Trueblue';
      case 'agent':
      case 'human':
        return 'Agente Trueblue';
      default:
        return senderRole;
    }
  };

  const getSenderColor = (senderRole: string) => {
    switch (senderRole) {
      case 'user':
        return 'text-blue-600';
      case 'ai':
        return 'text-purple-600';
      case 'agent':
      case 'human':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {conversation.username || conversation.user_id}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={conversation.status}
                onValueChange={(value: ConversationStatus) => onUpdateStatus(conversation.id, value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active_ai">AI Activo</SelectItem>
                  <SelectItem value="active_human">Humano Activo</SelectItem>
                  <SelectItem value="pending_human">Pendiente Humano</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>ID: {conversation.user_id}</span>
            <span>Estado: {conversation.status}</span>
          </div>

          {/* Conversation Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {conversation.status === 'active_ai' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignAgent(conversation.id, currentUser.id)}
              >
                Tomar conversación
              </Button>
            )}
            
            {conversation.status === 'active_human' && conversation.assigned_agent_id === currentUser.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(conversation.id, 'active_ai')}
              >
                Devolver a la IA
              </Button>
            )}
            
            {conversation.status === 'closed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdateStatus(conversation.id, 'active_human');
                  onAssignAgent(conversation.id, currentUser.id);
                }}
              >
                Reabrir conversación
              </Button>
            )}

            {/* Agent Assignment */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Asignar a:</span>
              <Select
                value={conversation.assigned_agent_id || ''}
                onValueChange={(value) => onAssignAgent(conversation.id, value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar agente" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 border rounded-lg bg-muted/20">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-2">
            {conversation.messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No hay mensajes en esta conversación
              </div>
            ) : (
              conversation.messages.map((message) => {
                const isUser = message.sender_role === 'user';
                return (
                  <div key={message.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                    <Card className={`max-w-md ${isUser ? 'mr-auto' : 'ml-auto'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={getSenderColor(message.sender_role)}>
                            {getSenderIcon(message.sender_role)}
                          </div>
                          <span className={`font-medium text-sm ${getSenderColor(message.sender_role)}`}>
                            {getSenderLabel(message.sender_role)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {(() => {
                              if (!message.created_at) return 'Fecha desconocida';
                              
                              const date = new Date(message.created_at);
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
                        
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.responded_by_agent_id && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Respondido por agente
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
            
            {/* Auto scroll to bottom */}
            <div ref={(el) => {
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
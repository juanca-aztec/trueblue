import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useProfiles } from '@/hooks/useProfiles';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationWithMessages } from '@/types/database';
import { LogOut, Users, MessageSquare, User, Activity } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { conversations, loading, sendMessage, updateConversationStatus, assignConversation } = useConversations();
  const { profiles } = useProfiles();
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithMessages | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  const getConversationStats = () => {
    const activeAI = conversations.filter(c => c.status === 'active_ai').length;
    const activeHuman = conversations.filter(c => c.status === 'active_human').length;
    const pending = conversations.filter(c => c.status === 'pending_human').length;
    const total = conversations.length;

    return { activeAI, activeHuman, pending, total };
  };

  const stats = getConversationStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Chat Management</h1>
            <Badge variant="outline">
              {profile?.role === 'admin' ? 'Administrador' : 'Agente'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{profile?.name}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-80 border-r bg-card p-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">AI Activo</p>
                    <p className="text-lg font-bold">{stats.activeAI}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Humano</p>
                    <p className="text-lg font-bold">{stats.activeHuman}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                    <p className="text-lg font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversations List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="p-4">
                  <ConversationList
                    conversations={conversations}
                    selectedConversationId={selectedConversation?.id}
                    onSelectConversation={setSelectedConversation}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUser={profile!}
              agents={profiles}
              onSendMessage={sendMessage}
              onUpdateStatus={updateConversationStatus}
              onAssignAgent={assignConversation}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecciona una conversación</h3>
                <p className="text-muted-foreground">
                  Elige una conversación de la lista para comenzar a chatear
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConversationWithMessages, Profile } from "@/types/database";
import { ConversationList } from "./ConversationList";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ConversationTabsProps {
  conversations: ConversationWithMessages[];
  selectedConversationId: string | null;
  onSelectConversation: (conversation: ConversationWithMessages) => void;
  agents: Profile[];
}

export function ConversationTabs({
  conversations,
  selectedConversationId,
  onSelectConversation,
  agents,
}: ConversationTabsProps) {
  const { profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("todas");
  const [agentFilter, setAgentFilter] = useState<string>("todos");
  
  const isAdmin = profile?.role === 'admin';
  
  const activeConversations = conversations.filter(
    conv => conv.status === 'active_ai' || conv.status === 'active_human' || conv.status === 'pending_human'
  );
  
  const filteredActiveConversations = activeConversations.filter(conv => {
    // Filter by status
    if (activeFilter !== "todas" && conv.status !== activeFilter) {
      return false;
    }
    
    // Filter by agent (only for admins)
    if (isAdmin && agentFilter !== "todos") {
      if (agentFilter === "sin_asignar") {
        return !conv.assigned_agent_id;
      }
      return conv.assigned_agent_id === agentFilter;
    }
    
    // Para agentes no-admin, mostrar conversaciones asignadas a ellos + sin asignar
    if (!isAdmin && profile) {
      return conv.assigned_agent_id === profile.id || !conv.assigned_agent_id;
    }
    
    return true;
  });
  
  const closedConversations = conversations.filter(
    conv => conv.status === 'closed'
  );

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full">
        <Tabs defaultValue="activas" className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-3">Conversaciones</h2>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activas">
                Activas ({activeConversations.length})
              </TabsTrigger>
              <TabsTrigger value="cerradas">
                Cerradas ({closedConversations.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="activas" className="flex-1 m-0 p-0 flex flex-col">
            <div className="p-4 border-b space-y-3">
              {/* Status Filter */}
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas ({activeConversations.length})</SelectItem>
                  <SelectItem value="active_ai">AI Activo ({activeConversations.filter(c => c.status === 'active_ai').length})</SelectItem>
                  <SelectItem value="pending_human">Pendiente Humano ({activeConversations.filter(c => c.status === 'pending_human').length})</SelectItem>
                  <SelectItem value="active_human">Humano Activo ({activeConversations.filter(c => c.status === 'active_human').length})</SelectItem>
                </SelectContent>
              </Select>

              {/* Agent Filter - Only visible for admins */}
              {isAdmin && (
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrar por agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los agentes</SelectItem>
                    <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex-1">
              <ConversationList
                conversations={filteredActiveConversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={onSelectConversation}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="cerradas" className="flex-1 m-0 p-0">
            <ConversationList
              conversations={closedConversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={onSelectConversation}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
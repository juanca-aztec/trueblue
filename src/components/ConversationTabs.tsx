
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConversationWithMessages, Profile } from "@/types/database";
import { ConversationList } from "./ConversationList";
import { ConversationSearch } from "./ConversationSearch";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { filterConversationsBySearch } from "@/utils/searchUtils";

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
  const [searchTerm, setSearchTerm] = useState<string>("");
  
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
    
    // Para agentes no-admin, mostrar conversaciones asignadas a ellos + las que están pending_human
    if (!isAdmin && profile) {
      return conv.assigned_agent_id === profile.id || conv.status === 'pending_human';
    }
    
    return true;
  });

  // Aplicar filtro de búsqueda a las conversaciones ya filtradas
  const searchFilteredActiveConversations = filterConversationsBySearch(filteredActiveConversations, searchTerm);
  
  const closedConversations = conversations.filter(
    conv => conv.status === 'closed'
  );

  // Aplicar filtro de búsqueda a las conversaciones cerradas también
  const searchFilteredClosedConversations = filterConversationsBySearch(closedConversations, searchTerm);

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full">
        <Tabs defaultValue="activas" className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-3">Conversaciones</h2>
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="activas">
                Activas ({searchFilteredActiveConversations.length})
              </TabsTrigger>
              <TabsTrigger value="cerradas">
                Cerradas ({searchFilteredClosedConversations.length})
              </TabsTrigger>
            </TabsList>
            
            {/* Search component */}
            <div className="mb-3">
              <ConversationSearch 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>
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
            <div className="flex-1 p-4">
              {searchTerm && (
                <div className="mb-3 text-sm text-muted-foreground">
                  {searchFilteredActiveConversations.length} resultado(s) para "{searchTerm}"
                </div>
              )}
              <ConversationList
                conversations={searchFilteredActiveConversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={onSelectConversation}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="cerradas" className="flex-1 m-0 p-0 flex flex-col">
            <div className="flex-1 p-4">
              {searchTerm && (
                <div className="mb-3 text-sm text-muted-foreground">
                  {searchFilteredClosedConversations.length} resultado(s) para "{searchTerm}"
                </div>
              )}
              <ConversationList
                conversations={searchFilteredClosedConversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={onSelectConversation}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConversationWithMessages } from "@/types/database";
import { ConversationList } from "./ConversationList";
import { useState } from "react";

interface ConversationTabsProps {
  conversations: ConversationWithMessages[];
  selectedConversationId: string | null;
  onSelectConversation: (conversation: ConversationWithMessages) => void;
}

export function ConversationTabs({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationTabsProps) {
  const [activeFilter, setActiveFilter] = useState<string>("todas");
  
  const activeConversations = conversations.filter(
    conv => conv.status === 'active_ai' || conv.status === 'active_human' || conv.status === 'pending_human'
  );
  
  const filteredActiveConversations = activeConversations.filter(conv => {
    if (activeFilter === "todas") return true;
    return conv.status === activeFilter;
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
            <div className="p-4 border-b">
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
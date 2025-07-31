import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationWithMessages } from "@/types/database";
import { ConversationList } from "./ConversationList";

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
  const activeConversations = conversations.filter(
    conv => conv.status === 'active_ai' || conv.status === 'active_human' || conv.status === 'pending_human'
  );
  
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
          
          <TabsContent value="activas" className="flex-1 m-0 p-0">
            <ConversationList
              conversations={activeConversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={onSelectConversation}
            />
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
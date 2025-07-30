import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationWithMessages, Message, ConversationStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('tb_conversations')
        .select(`
          *,
          assigned_agent:profiles!tb_conversations_assigned_agent_id_fkey(*)
        `)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Fetch messages for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          const { data: messages, error: messagesError } = await supabase
            .from('tb_messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

          if (messagesError) {
            console.error('Error fetching messages:', messagesError);
            return { 
              ...conversation, 
              messages: [],
              assigned_agent: Array.isArray(conversation.assigned_agent) ? conversation.assigned_agent[0] : conversation.assigned_agent 
            };
          }

          return {
            ...conversation,
            messages: messages || [],
            assigned_agent: Array.isArray(conversation.assigned_agent) ? conversation.assigned_agent[0] : conversation.assigned_agent
          } as ConversationWithMessages;
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string, agentId: string) => {
    try {
      const { error } = await supabase
        .from('tb_messages')
        .insert({
          conversation_id: conversationId,
          content,
          sender_role: 'agent' as const,
          responded_by_agent_id: agentId
        });

      if (error) throw error;

      // Update conversation status to active_human and timestamp
      await supabase
        .from('tb_conversations')
        .update({ 
          status: 'active_human' as ConversationStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      toast({
        title: "Mensaje enviado",
        description: "El mensaje se envió correctamente",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  };

  const updateConversationStatus = async (conversationId: string, status: ConversationStatus) => {
    try {
      const { error } = await supabase
        .from('tb_conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "El estado de la conversación se actualizó correctamente",
      });
    } catch (error) {
      console.error('Error updating conversation status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const assignConversation = async (conversationId: string, agentId: string) => {
    try {
      const { error } = await supabase
        .from('tb_conversations')
        .update({ 
          assigned_agent_id: agentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Conversación asignada",
        description: "La conversación se asignó correctamente",
      });
    } catch (error) {
      console.error('Error assigning conversation:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar la conversación",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchConversations();

    // Subscribe to conversation changes
    const conversationChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tb_conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    // Subscribe to message changes
    const messageChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tb_messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationChannel);
      supabase.removeChannel(messageChannel);
    };
  }, []);

  return {
    conversations,
    loading,
    sendMessage,
    updateConversationStatus,
    assignConversation,
    refetch: fetchConversations
  };
}
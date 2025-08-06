import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationWithMessages, Message, ConversationStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchConversations = async () => {
    try {
      console.log('🚀 fetchConversations iniciado');
      console.log('👤 Profile actual:', profile);
      
      if (!profile) {
        console.log('❌ No hay profile, terminando fetch');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching conversations for profile:', profile);
      console.log('🎭 Role del usuario:', profile.role);
      console.log('🆔 ID del profile:', profile.id);

      let conversationsQuery = supabase
        .from('tb_conversations')
        .select('*');

      // Si el usuario es agente (no admin), mostrar conversaciones asignadas a él + las que están pending_human
      if (profile.role === 'agent') {
        console.log('🕵️ Filtering conversations for agent:', profile.id);
        conversationsQuery = conversationsQuery.or(`assigned_agent_id.eq.${profile.id},status.eq.pending_human`);
      } else {
        console.log('👑 Usuario admin - mostrar todas las conversaciones');
        // Los admins ven todas las conversaciones, no aplicamos filtro
      }

      // Fetch conversations first
      const { data: conversationsData, error: conversationsError } = await conversationsQuery
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Fetch all profiles to match with assigned agents
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Create a map of profiles by id for easy lookup
      const profilesMap = new Map();
      (profilesData || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Fetch ALL messages first, then group by conversation for better performance
      const { data: allMessages, error: allMessagesError } = await supabase
        .from('tb_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (allMessagesError) {
        console.error('Error fetching all messages:', allMessagesError);
      }

      // Group conversations by user_id to consolidate duplicates
      const conversationsByUser = new Map();
      (conversationsData || []).forEach(conversation => {
        const userId = conversation.user_id;
        if (!conversationsByUser.has(userId)) {
          conversationsByUser.set(userId, conversation);
        } else {
          // If we already have a conversation for this user, keep the most recent one
          const existing = conversationsByUser.get(userId);
          if (new Date(conversation.updated_at) > new Date(existing.updated_at)) {
            conversationsByUser.set(userId, conversation);
          }
        }
      });

      // Group messages by conversation_id first, then consolidate by user
      const messagesByConversation = new Map();
      (allMessages || []).forEach(message => {
        if (!messagesByConversation.has(message.conversation_id)) {
          messagesByConversation.set(message.conversation_id, []);
        }
        messagesByConversation.get(message.conversation_id).push(message);
      });

      // Now group all messages by user_id
      const messagesByUser = new Map();
      conversationsByUser.forEach((conversation, userId) => {
        messagesByUser.set(userId, []);
      });

      // Find all conversation IDs for each user and collect their messages
      (conversationsData || []).forEach(conversation => {
        const userId = conversation.user_id;
        const conversationMessages = messagesByConversation.get(conversation.id) || [];
        
        if (messagesByUser.has(userId)) {
          const existingMessages = messagesByUser.get(userId);
          messagesByUser.set(userId, [...existingMessages, ...conversationMessages]);
        }
      });

      // Build consolidated conversations with all messages for each user
      const conversationsWithMessages = Array.from(conversationsByUser.entries()).map(([userId, conversation]) => {
        const allUserMessages = messagesByUser.get(userId) || [];
        
        // Sort all messages by created_at to ensure proper chronological order
        const sortedMessages = allUserMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        return {
          ...conversation,
          messages: sortedMessages,
          assigned_agent: conversation.assigned_agent_id ? profilesMap.get(conversation.assigned_agent_id) : null
        } as ConversationWithMessages;
      });

      // Sort conversations by updated_at (most recent first)
      conversationsWithMessages.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      console.log('Final conversations with messages:', conversationsWithMessages);
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
      // Get conversation details for Telegram chat ID
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      // Insert message in database
      const { error } = await supabase
        .from('tb_messages')
        .insert({
          conversation_id: conversationId,
          content,
          sender_role: 'agent' as const,
          responded_by_agent_id: agentId
        });

      if (error) throw error;

      // Auto-asignar la conversación al agente si no está asignada
      let updateData: any = { 
        status: 'active_human' as ConversationStatus,
        updated_at: new Date().toISOString()
      };

      if (!conversation.assigned_agent_id) {
        console.log('🔧 Auto-asignando conversación al agente:', agentId);
        updateData.assigned_agent_id = agentId;
      }

      // Update conversation status to active_human and assign agent if needed
      await supabase
        .from('tb_conversations')
        .update(updateData)
        .eq('id', conversationId);

      // Send message to Telegram
      try {
        const telegramResponse = await fetch('https://xmxmygsaogvbiemuzarm.supabase.co/functions/v1/send-telegram-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            chatId: conversation.user_id, // Using user_id as Telegram chat ID
            message: content,
            conversationId: conversationId
          }),
        });

        const telegramResult = await telegramResponse.json();
        
        if (!telegramResult.success) {
          console.warn('Failed to send message to Telegram:', telegramResult.error);
          toast({
            title: "Mensaje enviado",
            description: "Mensaje guardado pero no se pudo enviar por Telegram",
            variant: "destructive",
          });
          return;
        }
      } catch (telegramError) {
        console.warn('Telegram integration error:', telegramError);
        toast({
          title: "Mensaje enviado",
          description: "Mensaje guardado pero no se pudo enviar por Telegram",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Mensaje enviado",
        description: "El mensaje se envió correctamente a la base de datos y Telegram",
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
      let updateData: any = { status, updated_at: new Date().toISOString() };
      
      // Si el status es active_ai, asignar automáticamente el agente "Asistente Virtual TB"
      if (status === 'active_ai') {
        const { data: aiAgent } = await supabase
          .from('profiles')
          .select('*')
          .eq('name', 'Asistente Virtual TB')
          .single();
        
        if (aiAgent) {
          updateData.assigned_agent_id = aiAgent.id;
        }
      }

      const { error } = await supabase
        .from('tb_conversations')
        .update(updateData)
        .eq('id', conversationId);

      if (error) throw error;

      // Immediately update local state for better UX
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.id === conversationId) {
            const updatedConv = { ...conv, status, updated_at: new Date().toISOString() };
            
            // Si asignamos el agente AI, también actualizar el assigned_agent
            if (status === 'active_ai' && updateData.assigned_agent_id) {
              updatedConv.assigned_agent_id = updateData.assigned_agent_id;
              // Buscar el agente en las conversaciones existentes para obtener su información
              const aiAgentFromConversations = prevConversations.find(c => c.assigned_agent?.id === updateData.assigned_agent_id)?.assigned_agent;
              updatedConv.assigned_agent = aiAgentFromConversations || null;
            }
            
            return updatedConv;
          }
          return conv;
        })
      );

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
      // Get the agent profile to check if it's the AI agent
      const { data: agentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', agentId)
        .single();

      // Determinar el status basado en si es el agente AI o no
      const newStatus: ConversationStatus = agentProfile?.name === 'Asistente Virtual TB' ? 'active_ai' : 'active_human';

      const { error } = await supabase
        .from('tb_conversations')
        .update({ 
          assigned_agent_id: agentId,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;

      // Immediately update local state for better UX
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { 
                ...conv, 
                assigned_agent_id: agentId,
                assigned_agent: agentProfile,
                status: newStatus,
                updated_at: new Date().toISOString()
              }
            : conv
        )
      );

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
    if (!profile) return;
    
    fetchConversations();

    // Create unique channel names to avoid conflicts
    const conversationChannelName = `conversations-${Date.now()}`;
    const messageChannelName = `messages-${Date.now()}`;

    // Subscribe to conversation changes
    const conversationChannel = supabase
      .channel(conversationChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tb_conversations'
        },
        (payload) => {
          console.log('Conversation change detected:', payload);
          // Update local state immediately for better UX
          setTimeout(() => {
            fetchConversations();
          }, 100);
        }
      )
      .subscribe();

    // Subscribe to message changes
    const messageChannel = supabase
      .channel(messageChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tb_messages'
        },
        (payload) => {
          console.log('Message change detected:', payload);
          // Update local state immediately for better UX
          setTimeout(() => {
            fetchConversations();
          }, 100);
        }
      )
      .subscribe();

    console.log('Setting up realtime subscriptions...', {
      conversationChannel: conversationChannelName,
      messageChannel: messageChannelName
    });

    return () => {
      console.log('Cleaning up realtime subscriptions...');
      supabase.removeChannel(conversationChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [profile]);

  return {
    conversations,
    loading,
    sendMessage,
    updateConversationStatus,
    assignConversation,
    refetch: fetchConversations
  };
}
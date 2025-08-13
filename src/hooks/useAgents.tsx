import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useAgents() {
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los agentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Función para actualizar el estado local inmediatamente
  const updateLocalAgent = useCallback((agentId: string, updates: Partial<Profile>) => {
    setAgents(prevAgents => 
      prevAgents.map(agent => 
        agent.id === agentId 
          ? { ...agent, ...updates }
          : agent
      )
    );
  }, []);

  // Función para agregar un agente localmente
  const addLocalAgent = useCallback((agent: Profile) => {
    setAgents(prevAgents => [agent, ...prevAgents]);
  }, []);

  // Función para eliminar un agente localmente
  const removeLocalAgent = useCallback((agentId: string) => {
    setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
  }, []);

  const createAgent = async (email: string, name: string, role: 'admin' | 'agent' = 'agent') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      setLoading(true);

      console.log(`🚀 [${new Date().toISOString()}] Creando agente:`, {
        email,
        name,
        role
      });

      // Verificar si ya existe un perfil con este email
      console.log(`🔍 Verificando si existe perfil para: ${email}`);
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('❌ Error verificando perfil existente:', profileCheckError);
        throw profileCheckError;
      }

      if (existingProfile) {
        console.log(`⚠️ Ya existe perfil para: ${email}, eliminándolo para reemplazar`, existingProfile);
        
        // Eliminar el perfil existente
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', existingProfile.id);
          
        if (deleteError) {
          console.error('❌ Error eliminando perfil existente:', deleteError);
          throw deleteError;
        }
        
        console.log(`✅ Perfil existente eliminado para: ${email}`);
      }

      // Crear perfil en estado pendiente
      console.log(`📝 Creando perfil pendiente para: ${email}`);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: email,
          name: name,
          role: role,
          status: 'pending',
          created_by_name: user.user_metadata?.name || user.email,
          created_by_email: user.email
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Error creando perfil:', profileError);
        throw profileError;
      }
      
      console.log(`✅ Perfil pendiente creado para: ${email}`, profileData);

      // NO agregar agente localmente aquí - la suscripción en tiempo real lo hará
      // addLocalAgent(profileData); // ❌ REMOVIDO para evitar duplicación

      // Enviar invitación automáticamente mediante Edge Function
      console.log(`📧 Enviando invitación automáticamente a: ${email}`);
      try {
        const { data: inviteData, error: inviteError } = await supabase.functions.invoke('send-user-invitation', {
          body: {
            email,
            name,
            role,
            invitedBy: (user as any)?.id || user.email
          }
        });

        if (inviteError) {
          throw inviteError;
        }

        console.log('✅ Invitación enviada automáticamente:', inviteData);
        toast({
          title: "Agente creado e invitación enviada",
          description: `Se envió automáticamente la invitación a ${email}.`,
        });

      } catch (inviteError: any) {
        console.error('❌ Error enviando invitación automáticamente:', inviteError);
        // Aún con error de invitación, el perfil ya se creó
        toast({
          title: "Agente creado con advertencia",
          description: `El agente ${name} fue creado pero no se pudo enviar la invitación automáticamente: ${inviteError?.message || 'Error desconocido'}`,
          variant: "destructive",
        });
      }

      return { success: true, data: profileData };

    } catch (error: any) {
      console.error('💥 Error en createAgent:', error);
      
      toast({
        title: "Error",
        description: `No se pudo crear el agente: ${error?.message || 'Error desconocido'}`,
        variant: "destructive",
      });
      
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Eliminar agente localmente inmediatamente
      removeLocalAgent(id);
      
      toast({
        title: "Agente eliminado",
        description: `El agente ${name} ha sido eliminado correctamente`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el agente",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const resendInvitation = async (email: string) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Buscar el perfil del agente
      const { data: agent } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (!agent) {
        throw new Error('Agente no encontrado');
      }

      console.log(`🔄 [${new Date().toISOString()}] Reenviando invitación a: ${email}`);

      try {
        // Actualizar el perfil para indicar que se reenvió la invitación
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            updated_at: new Date().toISOString(),
            status: 'pending' // Asegurar que esté en estado pendiente
          })
          .eq('id', agent.id);

        if (updateError) {
          throw updateError;
        }

        // Invocar Edge Function para enviar la invitación automáticamente
        const { data: inviteData, error: inviteError } = await supabase.functions.invoke('send-user-invitation', {
          body: {
            email,
            name: agent.name,
            role: agent.role,
            invitedBy: (user as any)?.id || user.email
          }
        });

        if (inviteError) {
          throw inviteError;
        }

        console.log('✅ Invitación reenviada y enviada automáticamente:', inviteData);
        
        toast({
          title: "Invitación reenviada",
          description: `Se ha enviado la invitación a ${email} por email automáticamente.`,
        });

      } catch (inviteError: any) {
        console.error('❌ Error reenviando invitación:', inviteError);
        throw new Error(`Error reenviando invitación: ${inviteError?.message || 'Error desconocido'}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('💥 Error:', error);
      toast({
        title: "Error",
        description: `Error reenviando invitación: ${error?.message || 'Error desconocido'}`,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (id: string, updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Actualizar agente localmente inmediatamente
      updateLocalAgent(id, updates);
      
      toast({
        title: "Agente actualizado",
        description: "El agente se actualizó correctamente",
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el agente",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const toggleAgentStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return updateAgent(id, { status: newStatus });
  };

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions for agents...');
    
    // Fetch initial data
    fetchAgents();

    // Create unique channel name
    const agentChannelName = `agents-${Date.now()}`;

    // Subscribe to profile changes
    const agentChannel = supabase
      .channel(agentChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('🔄 Agent change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('➕ Nuevo agente creado');
            const newAgent = payload.new as Profile;
            addLocalAgent(newAgent);
          } else if (payload.eventType === 'UPDATE') {
            console.log('✏️ Agente actualizado');
            const updatedAgent = payload.new as Profile;
            updateLocalAgent(updatedAgent.id, updatedAgent);
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Agente eliminado');
            const deletedAgent = payload.old as Profile;
            removeLocalAgent(deletedAgent.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Agent channel subscription status:', status);
      });

    console.log('✅ Real-time subscriptions set up successfully for agents', {
      agentChannel: agentChannelName
    });

    return () => {
      console.log('🧹 Cleaning up real-time subscriptions for agents...');
      supabase.removeChannel(agentChannel);
    };
  }, [fetchAgents, addLocalAgent, updateLocalAgent, removeLocalAgent]);

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    resendInvitation,
    refetch: fetchAgents
  };
}

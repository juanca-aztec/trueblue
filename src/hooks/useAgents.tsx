import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useAgents() {
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgents = async () => {
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
  };

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

      // Enviar invitación
      console.log(`📧 Enviando invitación a: ${email}`);
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          email: email,
          name: name,
          role: role,
          invitedBy: user.user_metadata?.name || user.email || 'Admin'
        }
      });

      if (inviteError) {
        console.error('❌ Error en función de invitación:', inviteError);
        // Aún con error de invitación, el perfil ya se creó
        toast({
          title: "Agente creado con advertencia",
          description: `El agente ${name} fue creado pero no se pudo enviar la invitación: ${inviteError.message}`,
          variant: "destructive",
        });
      } else if (!inviteData.success && !inviteData.warning) {
        console.error('❌ Error en invitación:', inviteData.error);
        toast({
          title: "Agente creado con advertencia", 
          description: `El agente ${name} fue creado pero hubo un problema con la invitación: ${inviteData.error}`,
          variant: "destructive",
        });
      } else {
        // Éxito total o con advertencia manejable
        const message = inviteData.warning ? 
          `El agente ${name} ha sido creado. ${inviteData.message || inviteData.warning}` :
          `El agente ${name} ha sido creado y se ha enviado la invitación a ${email}`;
          
        toast({
          title: "Agente creado exitosamente",
          description: message,
        });
      }

      await fetchAgents();
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

      await fetchAgents();
      
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

      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          email: agent.email,
          name: agent.name,
          role: agent.role,
          invitedBy: user.user_metadata?.name || user.email || 'Admin'
        }
      });

      if (inviteError) {
        throw inviteError;
      }

      if (!inviteData.success && !inviteData.warning) {
        throw new Error(inviteData.error);
      } else {
        const message = inviteData.warning ? 
          `${inviteData.message || inviteData.warning}` :
          `Se ha reenviado la invitación a ${email}`;
          
        toast({
          title: "Invitación reenviada",
          description: message,
        });
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

      await fetchAgents();
      
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

  useEffect(() => {
    fetchAgents();
  }, []);

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

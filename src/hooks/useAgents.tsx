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

      const invitationToken = crypto.randomUUID();

      // Crear el perfil del agente sin user_id (se asignará cuando acepte la invitación)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: email,
          name: name,
          role: role,
          status: 'pending'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw profileError;
      }

      // Crear la invitación
      const { error: invitationError } = await supabase
        .from('user_invitations')
        .insert({
          email: email,
          role: role,
          token: invitationToken,
          invited_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (invitationError) {
        console.error('Error creating invitation:', invitationError);
        throw invitationError;
      }

      // Usar el sistema nativo de signup de Supabase con datos de invitación
      const redirectUrl = `${window.location.origin}/auth?token=${invitationToken}`;
      
      // En lugar de inviteUserByEmail, simplemente guardamos la invitación 
      // El usuario recibirá un email cuando haga signup con estos datos
      console.log(`Invitación creada para ${email} con token: ${invitationToken}`);
      console.log(`URL de redirección: ${redirectUrl}`);

      toast({
        title: "Agente creado",
        description: `Se ha creado el agente ${name}. El usuario debe registrarse usando el email ${email}`,
      });

      await fetchAgents();
      return { success: true };
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: `No se pudo crear el agente: ${error.message}`,
        variant: "destructive",
      });
      return { success: false, error };
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
    toggleAgentStatus,
    refetch: fetchAgents
  };
}
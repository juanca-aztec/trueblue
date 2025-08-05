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
      // Crear el perfil directamente
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: crypto.randomUUID(), // UUID temporal
          email: email,
          name: name,
          role: role,
          status: 'pending'
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Crear la invitación
      const { data: { user } } = await supabase.auth.getUser();
      const { error: invitationError } = await supabase
        .from('user_invitations')
        .insert({
          email: email,
          role: role,
          token: crypto.randomUUID(),
          invited_by: user?.id || '',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (invitationError) throw invitationError;

      toast({
        title: "Agente creado",
        description: `Se ha creado el agente ${name} exitosamente`,
      });

      await fetchAgents(); // Refrescar la lista
      return { success: true };
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el agente",
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
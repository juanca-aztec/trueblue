import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (email: string, role: 'admin' | 'agent') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get current user profile to get name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();

      // Create invitation record
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .insert({
          email,
          role,
          invited_by: user.id
        })
        .select('token')
        .single();

      if (error) throw error;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email,
          role,
          token: invitation.token,
          inviterName: profile?.name || user.email || 'Un administrador'
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        toast({
          title: "Invitación creada",
          description: `Invitación creada para ${email}, pero hubo un error enviando el email. El usuario puede registrarse con el token: ${invitation.token}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitación enviada",
          description: `Se ha enviado una invitación por email a ${email}`,
        });
      }

      await fetchProfiles();
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la invitación",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchProfiles(); // Refresh the list
      
      toast({
        title: "Perfil actualizado",
        description: "El perfil se actualizó correctamente",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
    loading,
    createInvitation,
    updateProfile,
    refetch: fetchProfiles
  };
}
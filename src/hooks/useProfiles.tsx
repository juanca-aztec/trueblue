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
      // Create invitation record first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      console.log('Creating invitation for:', email, 'with role:', role);

      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .insert({
          email,
          role,
          invited_by: user.id
        })
        .select('token')
        .single();

      if (inviteError) {
        console.error('Error creating invitation record:', inviteError);
        throw inviteError;
      }

      console.log('Invitation record created successfully:', invitation);

      // Use Supabase's native invitation system
      const redirectUrl = `${window.location.origin}/auth?invitation_token=${invitation.token}`;
      
      console.log('Attempting to send invitation email to:', email);
      console.log('Redirect URL:', redirectUrl);
      
      const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
        data: {
          invitation_token: invitation.token,
          role: role
        }
      });

      console.log('Email invitation result:', { emailError });

      if (emailError) {
        console.error('Error sending invitation:', emailError);
        toast({
          title: "Error",
          description: `No se pudo enviar la invitación por email: ${emailError.message}`,
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
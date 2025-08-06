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

      console.log(`🚀 [${new Date().toISOString()}] Creando agente directamente:`, {
        email,
        name,
        role
      });

      // Verificar si ya existe un usuario con este email
      console.log(`🔍 Verificando si existe usuario con email: ${email}`);
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (existingProfile) {
        console.log(`⚠️ Ya existe perfil para: ${email}`, existingProfile);
        toast({
          title: "Usuario ya existe",
          description: `Ya existe un perfil para ${email}`,
          variant: "destructive",
        });
        return { success: false, error: new Error('Usuario ya existe') };
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

      // Intentar enviar email de invitación
      let emailSent = false;
      try {
        console.log(`📧 Enviando email de invitación a: ${email}`);
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-user-invitation', {
          body: {
            email: email,
            name: name,
            role: role,
            invitedBy: user.user_metadata?.name || user.email || 'Admin'
          }
        });

        if (emailError) {
          console.error('❌ Error en función de email:', emailError);
          throw emailError;
        }

        console.log(`✅ Email enviado exitosamente a: ${email}`, emailData);
        emailSent = true;

      } catch (emailError: any) {
        console.error('💥 Error completo enviando email:', {
          error: emailError,
          message: emailError?.message,
          details: emailError?.details,
          hint: emailError?.hint,
          code: emailError?.code
        });
        
        // No fallar la creación del agente, solo mostrar advertencia
        emailSent = false;
      }

      // Mostrar mensaje apropiado según si el email se envió o no
      if (emailSent) {
        toast({
          title: "Agente creado exitosamente",
          description: `El agente ${name} ha sido creado y se ha enviado la invitación a ${email}`,
        });
      } else {
        toast({
          title: "Agente creado con advertencia",
          description: `El agente ${name} fue creado pero no se pudo enviar el email de invitación. El agente puede iniciar sesión directamente con ${email}.`,
          variant: "destructive",
        });
      }

      await fetchAgents();
      return { success: true, data: profileData };

    } catch (error: any) {
      console.error('💥 Error completo en createAgent:', {
        error,
        message: error?.message,
        timestamp: new Date().toISOString()
      });
      
      // Limpiar el perfil creado si hay un error crítico
      try {
        await supabase
          .from('profiles')
          .delete()
          .eq('email', email);
        console.log(`🧹 Perfil limpiado para: ${email}`);
      } catch (cleanupError) {
        console.error('❌ Error limpiando perfil:', cleanupError);
      }
      
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
      console.log(`🔄 [${new Date().toISOString()}] Agente ya activo: ${email}`);

      toast({
        title: "Agente ya está activo",
        description: `El agente ${email} ya puede iniciar sesión normalmente.`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('💥 Error:', error);
      toast({
        title: "Error",
        description: `Error inesperado: ${error?.message || 'Error desconocido'}`,
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

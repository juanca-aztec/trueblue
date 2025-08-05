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

      console.log(`🚀 [${new Date().toISOString()}] Iniciando creación de agente:`, {
        email,
        name,
        role,
        redirectUrl: `${window.location.origin}/auth`
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
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: email,
          name: name,
          role: role,
          status: 'pending',
          user_id: null, // Se asignará cuando el usuario confirme su email
          created_by: user.id,
          created_by_name: user.user_metadata?.name || user.email,
          created_by_email: user.email
        });

      if (profileError) {
        console.error('❌ Error creando perfil:', profileError);
        throw profileError;
      }
      console.log(`✅ Perfil pendiente creado para: ${email}`);

      // Crear usuario en Supabase Auth y enviar email de confirmación automáticamente
      const redirectUrl = `${window.location.origin}/auth`;
      
      console.log(`📧 Enviando invitación de Supabase Auth a: ${email}`);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: crypto.randomUUID(), // Password temporal que el usuario no necesitará
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            role: role
          }
        }
      });

      console.log(`📧 Respuesta completa de signUp:`, {
        data: signUpData,
        error: signUpError,
        timestamp: new Date().toISOString()
      });

      if (signUpError) {
        console.error('❌ Error en auth.signUp:', signUpError);
        
        // Detectar diferentes tipos de errores
        if (signUpError.message?.includes('rate limit') || signUpError.message?.includes('too many')) {
          console.error('🚫 RATE LIMIT DETECTADO:', signUpError.message);
          toast({
            title: "Límite de emails alcanzado",
            description: "Supabase tiene límites en el envío de emails. Intenta nuevamente en unos minutos o usa un email diferente.",
            variant: "destructive",
          });
        } else if (signUpError.message?.includes('already registered')) {
          console.error('👤 Usuario ya registrado:', signUpError.message);
          toast({
            title: "Usuario ya registrado",
            description: `El email ${email} ya está registrado en el sistema`,
            variant: "destructive",
          });
        } else {
          console.error('💥 Error desconocido en signUp:', signUpError.message);
          toast({
            title: "Error de autenticación",
            description: `Error específico: ${signUpError.message}`,
            variant: "destructive",
          });
        }
        
        throw signUpError;
      }

      // Verificar si el email fue enviado exitosamente
      if (signUpData?.user) {
        console.log(`✅ Usuario creado en Auth:`, {
          id: signUpData.user.id,
          email: signUpData.user.email,
          confirmed_at: signUpData.user.confirmed_at,
          email_confirmed_at: signUpData.user.email_confirmed_at
        });
        
        // Actualizar el perfil con el user_id del usuario recién creado
        console.log(`🔄 Actualizando perfil con user_id: ${signUpData.user.id}`);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_id: signUpData.user.id })
          .eq('email', email);

        if (updateError) {
          console.error('❌ Error actualizando user_id en perfil:', updateError);
        } else {
          console.log(`✅ Perfil actualizado con user_id para: ${email}`);
        }
        
        if (!signUpData.user.email_confirmed_at) {
          console.log(`📮 Email de confirmación enviado a: ${email}`);
          console.log(`🔗 URL de redirección configurada: ${redirectUrl}`);
        } else {
          console.log(`⚡ Usuario ya confirmado: ${email}`);
        }
      }

      toast({
        title: "Agente creado exitosamente",
        description: `Se ha enviado un email de confirmación a ${email}. Revisa también la carpeta de spam.`,
      });

      await fetchAgents();
      return { success: true, data: signUpData };
    } catch (error) {
      console.error('💥 Error completo en createAgent:', {
        error,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      // No mostrar toast adicional si ya se mostró uno específico
      if (!error.message?.includes('rate limit') && !error.message?.includes('already registered')) {
        toast({
          title: "Error",
          description: `No se pudo crear el agente: ${error.message}`,
          variant: "destructive",
        });
      }
      
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (email: string) => {
    try {
      setLoading(true);
      console.log(`🔄 [${new Date().toISOString()}] Reenviando invitación a: ${email}`);

      const redirectUrl = `${window.location.origin}/auth`;
      
      // Usar resend para reenviar confirmación
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('❌ Error reenviando invitación:', error);
        
        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          toast({
            title: "Límite de emails alcanzado",
            description: "Has alcanzado el límite de emails. Intenta nuevamente más tarde.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `No se pudo reenviar la invitación: ${error.message}`,
            variant: "destructive",
          });
        }
        return { success: false, error };
      }

      console.log(`✅ Invitación reenviada a: ${email}`);
      toast({
        title: "Invitación reenviada",
        description: `Se ha reenviado el email de confirmación a ${email}`,
      });

      return { success: true };
    } catch (error) {
      console.error('💥 Error reenviando invitación:', error);
      toast({
        title: "Error",
        description: `Error inesperado: ${error.message}`,
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
    toggleAgentStatus,
    resendInvitation,
    refetch: fetchAgents
  };
}
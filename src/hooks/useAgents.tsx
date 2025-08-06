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
      const { data: profileData, error: profileError } = await supabase
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
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Error creando perfil:', profileError);
        throw profileError;
      }
      console.log(`✅ Perfil pendiente creado para: ${email}`, profileData);

      // Intentar crear el usuario en Supabase Auth con retry logic
      const redirectUrl = `${window.location.origin}/auth`;
      let signUpData = null;
      let signUpError = null;
      let retryCount = 0;
      const maxRetries = 3;

      console.log(`📧 Enviando invitación de Supabase Auth a: ${email}`);

      while (retryCount < maxRetries) {
        try {
          console.log(`📧 Intento ${retryCount + 1} de ${maxRetries} para signUp`);
          
          const result = await supabase.auth.signUp({
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

          signUpData = result.data;
          signUpError = result.error;

          console.log(`📧 Respuesta intento ${retryCount + 1}:`, {
            data: signUpData,
            error: signUpError,
            timestamp: new Date().toISOString()
          });

          if (signUpError) {
            if (signUpError.message?.includes('already registered')) {
              console.log(`⚠️ Usuario ya registrado: ${email}, intentando recuperar datos`);
              
              // Si el usuario ya existe, simplemente continuamos
              // El perfil ya se creó, solo necesitamos asociarlo cuando el usuario se confirme
              toast({
                title: "Usuario ya registrado",
                description: `El email ${email} ya está registrado. Se ha creado el perfil de agente.`,
              });
              
              await fetchAgents();
              return { success: true, data: profileData };
              
            } else if (signUpError.message?.includes('rate limit') || signUpError.message?.includes('too many')) {
              console.log(`⏳ Rate limit alcanzado, reintentando en ${(retryCount + 1) * 2} segundos...`);
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, (retryCount) * 2000));
                continue;
              } else {
                toast({
                  title: "Límite de emails alcanzado",
                  description: "Supabase tiene límites en el envío de emails. El perfil fue creado, intenta reenviar la invitación más tarde.",
                  variant: "destructive",
                });
                await fetchAgents();
                return { success: true, data: profileData };
              }
            } else {
              console.error('💥 Error crítico en signUp:', signUpError.message);
              throw signUpError;
            }
          } else {
            // Éxito, salir del loop
            break;
          }
        } catch (error) {
          retryCount++;
          console.error(`❌ Error en intento ${retryCount}:`, error);
          if (retryCount >= maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }

      // Verificar si se creó el usuario exitosamente
      if (signUpData?.user) {
        console.log(`✅ Usuario creado en Auth:`, {
          id: signUpData.user.id,
          email: signUpData.user.email,
          confirmed_at: signUpData.user.confirmed_at,
          email_confirmed_at: signUpData.user.email_confirmed_at,
          user_metadata: signUpData.user.user_metadata
        });
        
        // Actualizar el perfil con el user_id con retry logic
        console.log(`🔄 Actualizando perfil con user_id: ${signUpData.user.id}`);
        let updateRetries = 0;
        const maxUpdateRetries = 3;
        let updateSuccess = false;

        while (updateRetries < maxUpdateRetries && !updateSuccess) {
          try {
            console.log(`🔄 Intento ${updateRetries + 1} de actualización del perfil`);
            
            const { data: updateData, error: updateError } = await supabase
              .from('profiles')
              .update({ 
                user_id: signUpData.user.id,
                status: 'active' // Activar el perfil una vez vinculado
              })
              .eq('email', email)
              .select();

            if (updateError) {
              console.error(`❌ Error en intento ${updateRetries + 1} actualizando user_id:`, {
                error: updateError,
                attempted_user_id: signUpData.user.id,
                email: email
              });
              updateRetries++;
              if (updateRetries < maxUpdateRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } else {
              console.log(`✅ Perfil actualizado exitosamente con user_id para: ${email}`, updateData);
              updateSuccess = true;
            }
          } catch (error) {
            console.error(`❌ Error inesperado actualizando perfil:`, error);
            updateRetries++;
            if (updateRetries < maxUpdateRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        if (!updateSuccess) {
          console.error(`❌ No se pudo actualizar el perfil después de ${maxUpdateRetries} intentos`);
          toast({
            title: "Advertencia", 
            description: "El usuario fue creado pero puede haber problemas de sincronización. Revisa el estado del agente.",
            variant: "destructive",
          });
        }
        
        // Verificar estado del email
        if (!signUpData.user.email_confirmed_at) {
          console.log(`📮 Email de confirmación enviado a: ${email}`);
          console.log(`🔗 URL de redirección configurada: ${redirectUrl}`);
        } else {
          console.log(`⚡ Usuario ya confirmado: ${email}`);
        }

        toast({
          title: "Agente creado exitosamente",
          description: `Se ha enviado un email de confirmación a ${email}. Revisa también la carpeta de spam.`,
        });

        await fetchAgents();
        return { success: true, data: profileData };

      } else {
        console.error('❌ No se pudo crear usuario válido después de todos los intentos');
        
        // El perfil ya existe, pero sin user_id - esto está bien
        // El usuario puede intentar reenviar la invitación más tarde
        toast({
          title: "Perfil creado",
          description: `Perfil creado para ${email}. Usa "Reenviar invitación" si es necesario.`,
        });

        await fetchAgents();
        return { success: true, data: profileData };
      }

    } catch (error) {
      console.error('💥 Error completo en createAgent:', {
        error,
        message: error.message,
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
        description: `No se pudo crear el agente: ${error.message}`,
        variant: "destructive",
      });
      
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


import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  name: string;
  role: string;
  invitedBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, role, invitedBy }: InvitationEmailRequest = await req.json();

    console.log(`📧 Procesando invitación para: ${email} por ${invitedBy}`);

    // Primero verificar si ya existe un usuario con este email
    const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error("❌ Error verificando usuarios:", userCheckError);
    }

    const existingUser = existingUsers?.users?.find(user => user.email === email);

    if (existingUser) {
      console.log(`🔄 Usuario ya existe: ${email}, procediendo a reemplazarlo/reinvitarlo`);
      
      try {
        // Eliminar el usuario existente
        const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
        
        if (deleteError) {
          console.error("❌ Error eliminando usuario existente:", deleteError);
          // Continuamos de todas formas, tal vez podamos invitarlo
        } else {
          console.log(`✅ Usuario existente eliminado: ${email}`);
        }
      } catch (deleteErr) {
        console.error("❌ Error en proceso de eliminación:", deleteErr);
      }
    }

    console.log(`📧 Enviando nueva invitación de Supabase a: ${email}`);

    // Usar el sistema de invitación nativo de Supabase
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        name: name,
        role: role,
        invited_by: invitedBy
      },
      redirectTo: 'https://trueblue.azteclab.co/auth'
    });

    if (error) {
      console.error("❌ Error enviando invitación de Supabase:", error);
      
      // Si aún hay error de email existente, intentamos con un enfoque diferente
      if (error.message?.includes('email_exists') || error.message?.includes('already been registered')) {
        console.log(`⚠️ Aún existe conflicto con email: ${email}, pero continuamos creando el perfil local`);
        
        return new Response(JSON.stringify({ 
          success: true, 
          warning: "Usuario ya registrado pero perfil local creado",
          message: `El usuario ${email} ya está en el sistema de auth, pero se procederá con el perfil local`
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
      
      throw error;
    }

    console.log("✅ Invitación enviada exitosamente:", data);

    return new Response(JSON.stringify({ 
      success: true, 
      data: data,
      message: `Invitación enviada exitosamente a ${email}`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error enviando invitación:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error desconocido'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);


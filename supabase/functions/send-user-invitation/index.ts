
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

    console.log(`📧 Verificando usuario existente: ${email}`);

    // Primero verificar si ya existe un usuario con este email
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error("❌ Error verificando usuarios:", userCheckError);
    }

    const userExists = existingUser?.users?.some(user => user.email === email);

    if (userExists) {
      console.log(`⚠️ Usuario ya existe: ${email}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Usuario ya registrado",
        message: `El usuario ${email} ya está registrado en el sistema`
      }), {
        status: 409, // Conflict
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    console.log(`📧 Enviando invitación de Supabase a: ${email} por ${invitedBy}`);

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
      
      // Manejar diferentes tipos de errores
      if (error.message?.includes('email_exists') || error.message?.includes('already been registered')) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Usuario ya registrado",
          message: `El usuario ${email} ya está registrado en el sistema`
        }), {
          status: 409, // Conflict
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
      data: data 
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

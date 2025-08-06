
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    console.log(`📧 Enviando email de invitación a: ${email} por ${invitedBy}`);

    const emailResponse = await resend.emails.send({
      from: "TrueBlue <onboarding@resend.dev>",
      to: [email],
      subject: `Invitación para unirse a TrueBlue como ${role === 'admin' ? 'Administrador' : 'Agente'}`,
      html: `
        <h1>¡Hola ${name}!</h1>
        <p>Has sido invitado por <strong>${invitedBy}</strong> para unirte a la plataforma TrueBlue como <strong>${role === 'admin' ? 'Administrador' : 'Agente'}</strong>.</p>
        
        <p>Para acceder a la plataforma, simplemente inicia sesión con tu email:</p>
        <p><strong>${email}</strong></p>
        
        <p>Puedes acceder en: <a href="https://trueblue.azteclab.co/auth">https://trueblue.azteclab.co/auth</a></p>
        
        <p>Una vez que inicies sesión, tu cuenta será activada automáticamente y podrás comenzar a usar la plataforma.</p>
        
        <p>¡Bienvenido al equipo!</p>
        <p>Saludos,<br>El equipo de TrueBlue</p>
      `,
    });

    console.log("✅ Email enviado exitosamente:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      data: emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error enviando email de invitación:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

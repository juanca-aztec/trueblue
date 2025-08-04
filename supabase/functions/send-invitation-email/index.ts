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
  role: 'admin' | 'agent';
  token: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, token, inviterName }: InvitationEmailRequest = await req.json();

    // Create magic link URL for registration
    const magicLink = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${token}&type=invite&redirect_to=${encodeURIComponent('https://xmxmygsaogvbiemuzarm.supabase.co')}/auth?invitation_token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "Sistema de Chat <onboarding@resend.dev>",
      to: [email],
      subject: "Invitación al Sistema de Gestión de Chat",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">¡Has sido invitado!</h1>
          
          <p>Hola,</p>
          
          <p>${inviterName} te ha invitado a unirte al Sistema de Gestión de Chat como <strong>${role === 'admin' ? 'Administrador' : 'Agente'}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Acceder a la Plataforma
            </a>
          </div>
          
          <p>Al hacer clic en el botón, podrás crear tu cuenta y acceder inmediatamente al sistema.</p>
          
          <p style="font-size: 12px; color: #666; margin-top: 40px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
            <a href="${magicLink}" style="color: #007bff; word-break: break-all;">${magicLink}</a>
          </p>
          
          <p style="font-size: 12px; color: #666;">
            Si no esperabas esta invitación, puedes ignorar este mensaje.
          </p>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  invitationToken: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, invitationToken, role }: InvitationRequest = await req.json();

    console.log('Edge function received request:', { email, role, invitationToken });

    // Construct invitation URL
    const invitationUrl = `https://preview--trueblue-chat-management.lovable.app/auth?invitation_token=${invitationToken}`;
    
    console.log('Sending invitation email to:', email);
    console.log('Invitation URL:', invitationUrl);
    
    // Send invitation email using Resend
    const emailResponse = await resend.emails.send({
      from: "Sistema de Chat <onboarding@resend.dev>",
      to: [email],
      subject: "Invitación al Sistema de Gestión de Chat",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">¡Has sido invitado!</h1>
          
          <p>Hola,</p>
          
          <p>Has sido invitado a unirte al Sistema de Gestión de Chat como <strong>${role === 'admin' ? 'Administrador' : 'Agente'}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Acceder a la Plataforma
            </a>
          </div>
          
          <p>Al hacer clic en el botón, podrás crear tu cuenta y acceder inmediatamente al sistema.</p>
          
          <p style="font-size: 12px; color: #666; margin-top: 40px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
            <a href="${invitationUrl}" style="color: #007bff; word-break: break-all;">${invitationUrl}</a>
          </p>
          
          <p style="font-size: 12px; color: #666;">
            Si no esperabas esta invitación, puedes ignorar este mensaje.
          </p>
        </div>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in send-user-invitation function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
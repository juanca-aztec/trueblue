import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  role: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, name }: InvitationRequest = await req.json();

    console.log('Edge function received request:', { email, role, name });

    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required environment variables' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client and Resend
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const resend = new Resend(resendApiKey);

    // Check for existing invitation
    console.log('Checking for existing invitation for:', email);
    const { data: existingInvitation, error: checkError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing invitation:', checkError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error checking existing invitations' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (existingInvitation) {
      console.log('Found existing valid invitation:', existingInvitation);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User already has a pending invitation. Please check their email or wait for the current invitation to expire.' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Generate unique token for invitation
    const invitationToken = crypto.randomUUID();
    
    // Create invitation record first
    console.log('Creating invitation record for:', email, 'with role:', role, 'and name:', name);
    const { data: invitationData, error: invitationError } = await supabase
      .from('user_invitations')
      .insert({
        email: email,
        role: role,
        token: invitationToken,
        invited_by: '703427fd-17f4-476a-be45-add2585c584f', // Admin user juanca@azteclab.co
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation record:', invitationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create invitation record',
          details: invitationError
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Invitation record created successfully:', invitationData);

    // Construct redirect URL with token
    const redirectUrl = `https://preview--trueblue-chat-management.lovable.app/auth?token=${invitationToken}&email=${encodeURIComponent(email)}`;
    
    console.log('Sending invitation email to:', email);
    console.log('Redirect URL:', redirectUrl);
    console.log('Role to assign:', role);
    console.log('Name to assign:', name);
    
    // Send invitation email using Resend
    try {
      const emailResponse = await resend.emails.send({
        from: 'TrueBlue Chat <onboarding@resend.dev>',
        to: [email],
        subject: 'Invitación al sistema TrueBlue Chat',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">¡Has sido invitado!</h1>
            <p>Hola <strong>${name}</strong>,</p>
            <p>Has sido invitado a unirte al sistema TrueBlue Chat como <strong>${role}</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${redirectUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                Aceptar Invitación
              </a>
            </div>
            <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px;">
              ${redirectUrl}
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Esta invitación expira en 7 días. Si no intentaste unirte al sistema, puedes ignorar este email.
            </p>
          </div>
        `,
      });

      console.log('Email sent successfully:', emailResponse);

      if (emailResponse.error) {
        throw new Error(`Failed to send email: ${emailResponse.error.message}`);
      }
    } catch (emailError: any) {
      console.error('Error sending invitation email:', emailError);
      
      // Don't clean up the invitation record - keep it for manual processing
      console.log('Email sending failed, but keeping invitation record for manual processing');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send invitation email. Please try again.',
          details: {
            message: emailError.message
          }
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Invitation sent successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          invitation: invitationData,
          email_sent: true
        }
      }),
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
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

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

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Construct redirect URL
    const redirectUrl = `https://preview--trueblue-chat-management.lovable.app/auth?invitation_token=${invitationToken}`;
    
    console.log('Sending invitation email to:', email);
    console.log('Redirect URL:', redirectUrl);
    
    // Send invitation email using admin privileges
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        invitation_token: invitationToken,
        role: role
      }
    });

    console.log('Email invitation result:', { emailError });

    if (emailError) {
      console.error('Error sending invitation:', emailError);
      return new Response(
        JSON.stringify({ success: false, error: emailError.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Invitation sent successfully');
    return new Response(
      JSON.stringify({ success: true }),
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
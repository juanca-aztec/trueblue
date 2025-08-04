import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role }: InvitationRequest = await req.json();

    console.log('Edge function received request:', { email, role });

    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required environment variables' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Construct redirect URL
    const redirectUrl = `https://preview--trueblue-chat-management.lovable.app/auth`;
    
    console.log('Sending invitation email to:', email);
    console.log('Redirect URL:', redirectUrl);
    console.log('Role to assign:', role);
    
    // Send invitation email using Supabase admin inviteUserByEmail
    const { data: inviteData, error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        role: role
      }
    });

    console.log('Invite response data:', inviteData);
    console.log('Email invitation error:', emailError);

    if (emailError) {
      console.error('Error sending invitation:', emailError);
      console.error('Error details:', JSON.stringify(emailError, null, 2));
      console.error('Error code:', emailError.code);
      console.error('Error status:', emailError.status);
      
      // Provide more specific error messages
      let userFriendlyMessage = emailError.message;
      if (emailError.code === 'unexpected_failure') {
        userFriendlyMessage = 'Database error while creating user invitation. Please try again.';
      } else if (emailError.message?.includes('already registered')) {
        userFriendlyMessage = 'This email is already registered. Please use a different email address.';
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userFriendlyMessage,
          details: {
            code: emailError.code,
            status: emailError.status,
            originalMessage: emailError.message
          }
        }),
        {
          status: emailError.status || 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Invitation sent successfully');
    return new Response(
      JSON.stringify({ success: true, data: inviteData }),
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
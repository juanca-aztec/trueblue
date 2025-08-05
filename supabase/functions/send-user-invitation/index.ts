import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

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

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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

    // Send invitation using Supabase Auth admin
    console.log('Sending invitation using Supabase Auth to:', email);
    console.log('Role to assign:', role);
    console.log('Name to assign:', name);
    
    try {
      // Use Supabase Auth admin to invite user by email
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${supabaseUrl.replace('https://', 'https://preview--trueblue-chat-management.lovable.app')}/auth?token=${invitationToken}&email=${encodeURIComponent(email)}`,
        data: {
          name: name,
          role: role,
          invitation_token: invitationToken
        }
      });

      if (authError) {
        console.error('Error sending Supabase invitation:', authError);
        throw new Error(`Failed to send invitation: ${authError.message}`);
      }

      console.log('Supabase invitation sent successfully:', authData);

    } catch (inviteError: any) {
      console.error('Error sending invitation:', inviteError);
      
      // Don't clean up the invitation record - keep it for manual processing
      console.log('Invitation sending failed, but keeping invitation record for manual processing');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send invitation. Please try again.',
          details: {
            message: inviteError.message
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
          invitation_sent: true
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
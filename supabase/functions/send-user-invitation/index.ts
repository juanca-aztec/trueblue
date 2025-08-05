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

    // Initialize Supabase client with service role key for admin operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the current user from the JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the requesting user is an admin using the admin client
    const { data: { user }, error: userError } = await adminClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if the user has admin role
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Insufficient permissions. Admin role required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const inviterUserId = user.id;

    // Check for existing invitation
    console.log('Checking for existing invitation for:', email);
    const { data: existingInvitation, error: checkError } = await adminClient
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
    const { data: invitationData, error: invitationError } = await adminClient
      .from('user_invitations')
      .insert({
        email: email,
        role: role,
        token: invitationToken,
        invited_by: inviterUserId, // Use the authenticated admin user ID
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
    
    // Send invitation email using Supabase admin inviteUserByEmail
    const { data: inviteData, error: emailError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        role: role,
        name: name,
        invitation_token: invitationToken
      }
    });

    console.log('Invite response data:', inviteData);

    if (emailError) {
      console.error('Error sending invitation email:', emailError);
      console.error('Error details:', JSON.stringify(emailError, null, 2));
      
      // Don't clean up the invitation record - keep it for manual processing
      console.log('Email sending failed, but keeping invitation record for manual processing');
      
      // Provide more specific error messages
      let userFriendlyMessage = emailError.message;
      if (emailError.code === 'unexpected_failure') {
        userFriendlyMessage = 'Failed to send invitation email. Please try again.';
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
      JSON.stringify({ 
        success: true, 
        data: {
          invitation: invitationData,
          email_sent: inviteData
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
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-User-Id, X-Username',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const userId = req.headers.get('X-User-Id');
    const username = req.headers.get('X-Username');
    
    if (!userId || !username) {
      return new Response(
        JSON.stringify({ error: 'User authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { key } = await req.json();
    
    if (!key || typeof key !== 'string') {
      return new Response(
        JSON.stringify({ error: 'License key is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user exists
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Find the key
    const { data: keyData, error: fetchError } = await supabase
      .from('license_keys')
      .select('*')
      .eq('key', key.trim())
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!keyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid license key' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (keyData.user_id) {
      return new Response(
        JSON.stringify({ error: 'This key has already been claimed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Claim the key
    const { error: updateError } = await supabase
      .from('license_keys')
      .update({
        user_id: userId,
        claimed_at: new Date().toISOString(),
        claimed_by_username: username
      })
      .eq('key', key.trim())
      .is('user_id', null);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'License key claimed successfully!' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error claiming key:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

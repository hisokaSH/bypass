import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ValidateRequest {
  key: string;
  machine_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { key, machine_id }: ValidateRequest = await req.json();

    if (!key) {
      return new Response(
        JSON.stringify({ valid: false, error: 'License key is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: licenseKey, error: fetchError } = await supabase
      .from('license_keys')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!licenseKey) {
      await supabase.from('key_validations').insert({
        license_key_id: null,
        success: false,
        machine_id: machine_id || null,
        ip_address: req.headers.get('x-forwarded-for') || null,
      });

      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid license key' }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(licenseKey.expires_at);
    const isExpired = expiresAt < now;
    const isRevoked = licenseKey.status === 'revoked';

    if (licenseKey.machine_id && machine_id && licenseKey.machine_id !== machine_id) {
      await supabase.from('key_validations').insert({
        license_key_id: licenseKey.id,
        success: false,
        machine_id: machine_id || null,
        ip_address: req.headers.get('x-forwarded-for') || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'License key is bound to a different machine',
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (isRevoked) {
      await supabase.from('key_validations').insert({
        license_key_id: licenseKey.id,
        success: false,
        machine_id: machine_id || null,
        ip_address: req.headers.get('x-forwarded-for') || null,
      });

      return new Response(
        JSON.stringify({ valid: false, error: 'License key has been revoked' }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (isExpired) {
      await supabase
        .from('license_keys')
        .update({ status: 'expired' })
        .eq('id', licenseKey.id);

      await supabase.from('key_validations').insert({
        license_key_id: licenseKey.id,
        success: false,
        machine_id: machine_id || null,
        ip_address: req.headers.get('x-forwarded-for') || null,
      });

      return new Response(
        JSON.stringify({ valid: false, error: 'License key has expired' }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!licenseKey.machine_id && machine_id) {
      await supabase
        .from('license_keys')
        .update({ machine_id, last_validated_at: new Date().toISOString() })
        .eq('id', licenseKey.id);
    } else {
      await supabase
        .from('license_keys')
        .update({ last_validated_at: new Date().toISOString() })
        .eq('id', licenseKey.id);
    }

    await supabase.from('key_validations').insert({
      license_key_id: licenseKey.id,
      success: true,
      machine_id: machine_id || null,
      ip_address: req.headers.get('x-forwarded-for') || null,
    });

    return new Response(
      JSON.stringify({
        valid: true,
        expires_at: licenseKey.expires_at,
        days_remaining: Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ valid: false, error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
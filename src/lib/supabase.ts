import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LicenseKey = {
  id: string;
  user_id: string;
  key: string;
  status: 'active' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
  last_validated_at: string | null;
  machine_id: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type KeyValidation = {
  id: string;
  license_key_id: string;
  validated_at: string;
  success: boolean;
  machine_id: string | null;
  ip_address: string | null;
};
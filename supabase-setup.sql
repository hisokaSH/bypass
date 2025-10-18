/*
  # Authentication and License Key Management Schema

  ## Overview
  This migration creates a comprehensive license key system for subscription-based software.

  ## Instructions
  1. Go to your Supabase project dashboard
  2. Navigate to SQL Editor
  3. Copy and paste this entire SQL script
  4. Run the script

  ## New Tables

  ### `user_profiles`
  Extends auth.users with additional user information

  ### `license_keys`
  Stores license keys for users with expiration and machine binding

  ### `key_validations`
  Audit log for key validation attempts

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Validation attempts are logged for auditing
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create license_keys table
CREATE TABLE IF NOT EXISTS license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  key text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_validated_at timestamptz,
  machine_id text,
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'revoked'))
);

ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own license keys"
  ON license_keys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create key_validations audit table
CREATE TABLE IF NOT EXISTS key_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key_id uuid REFERENCES license_keys(id) ON DELETE CASCADE,
  validated_at timestamptz DEFAULT now(),
  success boolean NOT NULL,
  machine_id text,
  ip_address text
);

ALTER TABLE key_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own key validations"
  ON key_validations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM license_keys
      WHERE license_keys.id = key_validations.license_key_id
      AND license_keys.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_license_keys_user_id ON license_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(key);
CREATE INDEX IF NOT EXISTS idx_license_keys_status ON license_keys(status);
CREATE INDEX IF NOT EXISTS idx_key_validations_license_key_id ON key_validations(license_key_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
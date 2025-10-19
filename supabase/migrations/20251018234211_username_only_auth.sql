/*
  # Username-Only Authentication System

  ## Overview
  This migration removes all email dependencies and implements pure username-based authentication.

  ## Changes
  1. Create user_credentials table to store usernames and hashed passwords
  2. Remove dependency on Supabase auth.users table for authentication
  3. Add functions for user registration and login
  4. Update user_profiles to work with username-only system
  5. Set up proper RLS policies

  ## Security
  - Passwords are hashed using pgcrypto extension
  - RLS policies restrict access to own data only
  - Session management handled separately
*/

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create user_credentials table for username/password storage
CREATE TABLE IF NOT EXISTS user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Enable RLS
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only read their own credentials
CREATE POLICY "Users can read own credentials"
  ON user_credentials FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Update user_profiles to not require auth.users
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Make username required in user_profiles
ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;

-- Function to register a new user
CREATE OR REPLACE FUNCTION register_user(
  p_username text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_password_hash text;
BEGIN
  -- Validate inputs
  IF char_length(p_username) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Username must be at least 3 characters');
  END IF;
  
  IF char_length(p_password) < 6 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 6 characters');
  END IF;
  
  IF p_username !~ '^[a-zA-Z0-9_]+$' THEN
    RETURN json_build_object('success', false, 'error', 'Username can only contain letters, numbers, and underscores');
  END IF;
  
  -- Check if username exists
  IF EXISTS (SELECT 1 FROM user_credentials WHERE username = p_username) THEN
    RETURN json_build_object('success', false, 'error', 'Username already exists');
  END IF;
  
  -- Hash password
  v_password_hash := crypt(p_password, gen_salt('bf', 10));
  
  -- Create user credential
  INSERT INTO user_credentials (username, password_hash)
  VALUES (p_username, v_password_hash)
  RETURNING id INTO v_user_id;
  
  -- Create user profile
  INSERT INTO user_profiles (id, username, is_admin)
  VALUES (v_user_id, p_username, false);
  
  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$;

-- Function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_password_hash text;
  v_is_admin boolean;
BEGIN
  -- Get user credentials
  SELECT id, password_hash
  INTO v_user_id, v_password_hash
  FROM user_credentials
  WHERE username = p_username;
  
  -- Check if user exists
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password');
  END IF;
  
  -- Verify password
  IF v_password_hash != crypt(p_password, v_password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password');
  END IF;
  
  -- Update last login
  UPDATE user_credentials
  SET last_login = now()
  WHERE id = v_user_id;
  
  -- Get admin status
  SELECT is_admin INTO v_is_admin
  FROM user_profiles
  WHERE id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'username', p_username,
    'is_admin', COALESCE(v_is_admin, false)
  );
END;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_credentials_username ON user_credentials(username);

/*
  # Recreate register_user function
  
  1. Purpose
    - Fix the register_user function to ensure it works properly with user_profiles table
    
  2. Changes
    - Drop and recreate the register_user function
    - Ensure proper column references
*/

-- Drop existing function
DROP FUNCTION IF EXISTS register_user(text, text);

-- Recreate the function
CREATE OR REPLACE FUNCTION register_user(p_username text, p_password text)
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

  -- Create user profile with explicit column names
  INSERT INTO user_profiles (id, username, is_admin)
  VALUES (v_user_id, p_username, false);

  RETURN json_build_object('success', true, 'user_id', v_user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION register_user(text, text) TO anon, authenticated;

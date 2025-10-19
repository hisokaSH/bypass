/*
  # Recreate authenticate_user function
  
  1. Purpose
    - Fix the authenticate_user function to ensure proper error handling
    
  2. Changes
    - Drop and recreate the authenticate_user function
    - Add better error handling
*/

-- Drop existing function
DROP FUNCTION IF EXISTS authenticate_user(text, text);

-- Recreate the function
CREATE OR REPLACE FUNCTION authenticate_user(p_username text, p_password text)
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION authenticate_user(text, text) TO anon, authenticated;

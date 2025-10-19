/*
  # Fix register_user function to properly handle username in user_profiles

  1. Changes
    - Drop and recreate register_user function
    - Ensure username is properly inserted into user_profiles table
    - Add proper error handling
*/

-- Drop existing function
DROP FUNCTION IF EXISTS register_user(text, text);

-- Recreate function with proper username handling
CREATE OR REPLACE FUNCTION register_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_password_hash text;
BEGIN
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM user_credentials WHERE username = p_username) THEN
    RETURN json_build_object('success', false, 'message', 'Username already exists');
  END IF;

  -- Generate user ID
  v_user_id := gen_random_uuid();
  
  -- Hash password
  v_password_hash := crypt(p_password, gen_salt('bf'));
  
  -- Insert into user_credentials
  INSERT INTO user_credentials (id, username, password_hash)
  VALUES (v_user_id, p_username, v_password_hash);
  
  -- Insert into user_profiles with username
  INSERT INTO user_profiles (id, username, email, is_admin)
  VALUES (
    v_user_id, 
    p_username,
    NULL,
    CASE WHEN p_username = 'Admin123' THEN true ELSE false END
  );
  
  RETURN json_build_object(
    'success', true, 
    'user_id', v_user_id,
    'username', p_username
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', SQLERRM
    );
END;
$$;
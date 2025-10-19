/*
  # Update Schema for Username-Based Authentication

  ## Changes
  1. Add username column to user_profiles table
  2. Remove email requirement from user_profiles
  3. Update trigger to handle username instead of email
  4. Add unique constraint on username

  ## Important Notes
  - Users will now authenticate with username + password
  - Email is completely optional and not used for authentication
  - Usernames must be unique across the system
*/

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username text UNIQUE;
  END IF;
END $$;

-- Make email optional
ALTER TABLE user_profiles ALTER COLUMN email DROP NOT NULL;

-- Update the trigger function to handle username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index on username for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
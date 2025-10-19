/*
  # Add username column to user_profiles

  1. Changes
    - Add username column to user_profiles table
    - Add is_admin column to user_profiles table
    - Make username unique and not null
*/

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username text;
  END IF;
END $$;

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Make username unique and not null (only if column was just created and empty)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    -- Only add constraints if there's no data or all usernames are populated
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE username IS NULL) THEN
      -- Add unique constraint if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_profiles_username_key'
      ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_username_key UNIQUE (username);
      END IF;

      -- Add not null constraint if it doesn't exist
      ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;
    END IF;
  END IF;
END $$;

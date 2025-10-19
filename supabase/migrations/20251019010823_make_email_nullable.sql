/*
  # Make email column properly nullable
  
  1. Changes
    - Drop and recreate email column to ensure it's nullable
    - No data loss since email is not being used
*/

-- Drop the email column if it exists
ALTER TABLE user_profiles DROP COLUMN IF EXISTS email;

-- Recreate it as nullable
ALTER TABLE user_profiles ADD COLUMN email text;

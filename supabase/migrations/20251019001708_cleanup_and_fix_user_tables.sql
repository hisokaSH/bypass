/*
  # Clean up and fix user tables relationship

  1. Problem
    - Old user_profiles exist without corresponding user_credentials
    - Foreign key relationship is missing or incorrect
  
  2. Solution
    - Delete orphaned user_profiles that don't have matching user_credentials
    - Ensure proper foreign key from user_profiles -> user_credentials
    - This maintains data integrity for the username-only auth system
*/

-- Delete orphaned user_profiles that don't have matching user_credentials
DELETE FROM user_profiles
WHERE id NOT IN (SELECT id FROM user_credentials);

-- Drop any incorrect foreign keys
ALTER TABLE user_credentials 
DROP CONSTRAINT IF EXISTS user_credentials_id_fkey;

-- Add the correct foreign key from user_profiles to user_credentials
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey_credentials;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_id_fkey_credentials
FOREIGN KEY (id)
REFERENCES user_credentials(id)
ON DELETE CASCADE;

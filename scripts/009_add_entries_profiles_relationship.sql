-- Add foreign key relationship between entries and profiles
-- This will enable proper profile joins in queries

ALTER TABLE entries 
ADD CONSTRAINT fk_entries_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Also ensure the profiles table has proper primary key
ALTER TABLE profiles 
ADD CONSTRAINT pk_profiles_id 
PRIMARY KEY (id);

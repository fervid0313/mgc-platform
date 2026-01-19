-- Check and add foreign key relationships for entries-profiles join
-- This script safely adds relationships only if they don't exist

-- Check if the foreign key constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_entries_user_id' 
        AND table_name = 'entries'
    ) THEN
        -- Add foreign key relationship between entries and profiles
        ALTER TABLE entries 
        ADD CONSTRAINT fk_entries_user_id 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added fk_entries_user_id constraint';
    ELSE
        RAISE NOTICE 'fk_entries_user_id constraint already exists';
    END IF;
END $$;

-- Check if profiles table has primary key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'pk_profiles_id' 
        AND table_name = 'profiles'
    ) THEN
        -- Add primary key to profiles table
        ALTER TABLE profiles 
        ADD CONSTRAINT pk_profiles_id 
        PRIMARY KEY (id);
        
        RAISE NOTICE 'Added pk_profiles_id constraint';
    ELSE
        RAISE NOTICE 'pk_profiles_id constraint already exists';
    END IF;
END $$;

-- Verify the relationships were created
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_name = kcu.table_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_name = tc.table_name
WHERE tc.table_name IN ('entries', 'profiles')
    AND tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY')
ORDER BY tc.table_name, tc.constraint_type;

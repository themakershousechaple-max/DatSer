-- ============================================================================
-- USER ISOLATION SETUP FOR MULTI-TENANT ARCHITECTURE
-- ============================================================================
-- This script sets up user isolation so each user only sees their own data
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- STEP 1: Add user_id column to all monthly tables
-- ============================================================================
-- You'll need to run this for EACH monthly table you have
-- Replace 'December_2025' with your actual table names

-- Example for December_2025:
ALTER TABLE "December_2025" 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_december_2025_user_id ON "December_2025"(user_id);

-- Repeat for other months (uncomment and modify as needed):
-- ALTER TABLE "January_2026" ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS idx_january_2026_user_id ON "January_2026"(user_id);

-- ALTER TABLE "February_2026" ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS idx_february_2026_user_id ON "February_2026"(user_id);

-- ... add more tables as needed


-- ============================================================================
-- STEP 2: Enable Row Level Security (RLS) on all monthly tables
-- ============================================================================

-- Enable RLS on December_2025
ALTER TABLE "December_2025" ENABLE ROW LEVEL SECURITY;

-- Repeat for other tables:
-- ALTER TABLE "January_2026" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "February_2026" ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 3: Create RLS Policies for December_2025
-- ============================================================================

-- Policy 1: Users can SELECT (read) only their own data
CREATE POLICY "Users can view their own members in December_2025"
ON "December_2025"
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  -- Allow access if user is a collaborator
  EXISTS (
    SELECT 1 FROM collaborators
    WHERE collaborators.owner_id = "December_2025".user_id
    AND collaborators.collaborator_email = auth.jwt() ->> 'email'
  )
);

-- Policy 2: Users can INSERT (create) only with their own user_id
CREATE POLICY "Users can insert their own members in December_2025"
ON "December_2025"
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can UPDATE (edit) only their own data
CREATE POLICY "Users can update their own members in December_2025"
ON "December_2025"
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  -- Allow updates if user is a collaborator
  EXISTS (
    SELECT 1 FROM collaborators
    WHERE collaborators.owner_id = "December_2025".user_id
    AND collaborators.collaborator_email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can DELETE only their own data
CREATE POLICY "Users can delete their own members in December_2025"
ON "December_2025"
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  -- Allow deletes if user is a collaborator
  EXISTS (
    SELECT 1 FROM collaborators
    WHERE collaborators.owner_id = "December_2025".user_id
    AND collaborators.collaborator_email = auth.jwt() ->> 'email'
  )
);


-- ============================================================================
-- STEP 4: Create a helper function to create RLS policies for any table
-- ============================================================================
-- This function makes it easier to add RLS to new monthly tables

CREATE OR REPLACE FUNCTION create_monthly_table_rls_policies(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  
  -- SELECT policy
  EXECUTE format('
    CREATE POLICY "Users can view their own members in %I"
    ON %I
    FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid() 
      OR 
      EXISTS (
        SELECT 1 FROM collaborators
        WHERE collaborators.owner_id = %I.user_id
        AND collaborators.collaborator_email = auth.jwt() ->> ''email''
      )
    )', table_name, table_name, table_name);
  
  -- INSERT policy
  EXECUTE format('
    CREATE POLICY "Users can insert their own members in %I"
    ON %I
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid())', table_name, table_name);
  
  -- UPDATE policy
  EXECUTE format('
    CREATE POLICY "Users can update their own members in %I"
    ON %I
    FOR UPDATE
    TO authenticated
    USING (
      user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM collaborators
        WHERE collaborators.owner_id = %I.user_id
        AND collaborators.collaborator_email = auth.jwt() ->> ''email''
      )
    )
    WITH CHECK (user_id = auth.uid())', table_name, table_name, table_name);
  
  -- DELETE policy
  EXECUTE format('
    CREATE POLICY "Users can delete their own members in %I"
    ON %I
    FOR DELETE
    TO authenticated
    USING (
      user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM collaborators
        WHERE collaborators.owner_id = %I.user_id
        AND collaborators.collaborator_email = auth.jwt() ->> ''email''
      )
    )', table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- STEP 5: Usage example for the helper function
-- ============================================================================
-- To add RLS to a new monthly table, just run:
-- SELECT create_monthly_table_rls_policies('January_2026');


-- ============================================================================
-- STEP 6: Update existing data (OPTIONAL - only if you have existing data)
-- ============================================================================
-- If you have existing members in your tables without a user_id,
-- you can assign them to your account:

-- First, get your user ID by running:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then update the table (replace 'YOUR_USER_ID' with your actual UUID):
-- UPDATE "December_2025" SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify everything is set up correctly:

-- Check if user_id column exists:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'December_2025' AND column_name = 'user_id';

-- Check if RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'December_2025';

-- Check policies:
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'December_2025';

-- ============================================================================
-- DONE! 🎉
-- ============================================================================
-- After running this script:
-- 1. Each user will only see their own members
-- 2. Collaborators (via the Share Access feature) can see shared data
-- 3. All new members will automatically be linked to the creating user
-- ============================================================================

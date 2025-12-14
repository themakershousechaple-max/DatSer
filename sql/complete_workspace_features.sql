-- Migration: Complete Workspace Features
-- 1. Create RPC function to batch update workspace names across all tables
-- 2. Add ON DELETE CASCADE to allow automatic data cleanup

-- =================================================================
-- Part 1: RPC Function for Batch Workspace Updates
-- usage: await supabase.rpc('update_user_workspace_name', { new_name: 'New Name' })
-- =================================================================

CREATE OR REPLACE FUNCTION update_user_workspace_name(new_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_record RECORD;
BEGIN
  -- 1. Update user_preferences
  UPDATE user_preferences 
  SET workspace_name = new_name 
  WHERE user_id = auth.uid();

  -- 2. Loop through all monthly tables and update workspace column
  -- Matches tables like January_2025, Nov_2025_2, etc.
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (
        table_name ~ '^[A-Za-z]+_20\d{2}$' OR 
        table_name ~ '^[A-Za-z]+_20\d{2}_\d+$'
      )
  LOOP
    -- Execute dynamic SQL to update the workspace column
    EXECUTE format('UPDATE %I SET workspace = $1 WHERE user_id = auth.uid()', table_record.table_name)
    USING new_name;
  END LOOP;
END;
$$;

-- =================================================================
-- Part 2: Add ON DELETE CASCADE to all Monthly Tables
-- This ensures when a user is deleted, their data is gone too.
-- =================================================================

-- Helper generic block to drop and recreate constraint for January_2025
DO $$
BEGIN
    ALTER TABLE "January_2025" DROP CONSTRAINT IF EXISTS "January_2025_user_id_fkey";
    ALTER TABLE "January_2025" ADD CONSTRAINT "January_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; -- Ignore if table doesn't exist
END $$;

DO $$
BEGIN
    ALTER TABLE "February_2025" DROP CONSTRAINT IF EXISTS "February_2025_user_id_fkey";
    ALTER TABLE "February_2025" ADD CONSTRAINT "February_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "March_2025" DROP CONSTRAINT IF EXISTS "March_2025_user_id_fkey";
    ALTER TABLE "March_2025" ADD CONSTRAINT "March_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "April_2025" DROP CONSTRAINT IF EXISTS "April_2025_user_id_fkey";
    ALTER TABLE "April_2025" ADD CONSTRAINT "April_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "May_2025" DROP CONSTRAINT IF EXISTS "May_2025_user_id_fkey";
    ALTER TABLE "May_2025" ADD CONSTRAINT "May_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "June_2025" DROP CONSTRAINT IF EXISTS "June_2025_user_id_fkey";
    ALTER TABLE "June_2025" ADD CONSTRAINT "June_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "July_2025" DROP CONSTRAINT IF EXISTS "July_2025_user_id_fkey";
    ALTER TABLE "July_2025" ADD CONSTRAINT "July_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "August_2025" DROP CONSTRAINT IF EXISTS "August_2025_user_id_fkey";
    ALTER TABLE "August_2025" ADD CONSTRAINT "August_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "September_2025" DROP CONSTRAINT IF EXISTS "September_2025_user_id_fkey";
    ALTER TABLE "September_2025" ADD CONSTRAINT "September_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "October_2025" DROP CONSTRAINT IF EXISTS "October_2025_user_id_fkey";
    ALTER TABLE "October_2025" ADD CONSTRAINT "October_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "November_2025" DROP CONSTRAINT IF EXISTS "November_2025_user_id_fkey";
    ALTER TABLE "November_2025" ADD CONSTRAINT "November_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "December_2025" DROP CONSTRAINT IF EXISTS "December_2025_user_id_fkey";
    ALTER TABLE "December_2025" ADD CONSTRAINT "December_2025_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "Nov_2025_2" DROP CONSTRAINT IF EXISTS "Nov_2025_2_user_id_fkey";
    ALTER TABLE "Nov_2025_2" ADD CONSTRAINT "Nov_2025_2_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

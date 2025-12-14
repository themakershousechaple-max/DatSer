-- Migration: Add workspace column to all monthly tables
-- Purpose: Allow easy filtering by workspace/organization name
-- Date: 2025-12-14

-- ============================================
-- Step 1: Add workspace column to all tables
-- ============================================

ALTER TABLE "January_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "December_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "November_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "October_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "September_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "August_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "July_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "June_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "May_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "April_2025" 
ADD COLUMN IF NOT EXISTS workspace text;

ALTER TABLE "Nov_2025_2" 
ADD COLUMN IF NOT EXISTS workspace text;

-- ============================================
-- Step 2: Create indexes for faster filtering
-- ============================================

CREATE INDEX IF NOT EXISTS idx_january_2025_workspace ON "January_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_december_2025_workspace ON "December_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_november_2025_workspace ON "November_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_october_2025_workspace ON "October_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_september_2025_workspace ON "September_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_august_2025_workspace ON "August_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_july_2025_workspace ON "July_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_june_2025_workspace ON "June_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_may_2025_workspace ON "May_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_april_2025_workspace ON "April_2025"(workspace);
CREATE INDEX IF NOT EXISTS idx_nov_2025_2_workspace ON "Nov_2025_2"(workspace);

-- ============================================
-- Step 3: Backfill existing data
-- Copy workspace names from user_preferences
-- ============================================

UPDATE "January_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "December_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "November_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "October_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "September_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "August_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "July_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "June_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "May_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "April_2025" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

UPDATE "Nov_2025_2" j
SET workspace = up.workspace_name
FROM user_preferences up
WHERE j.user_id = up.user_id
  AND j.workspace IS NULL;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'January_2025'
  AND column_name = 'workspace';

-- Check backfill results
SELECT 
  COUNT(*) as total_members,
  COUNT(workspace) as members_with_workspace,
  COUNT(*) - COUNT(workspace) as members_without_workspace
FROM "January_2025";

-- See workspace distribution
SELECT 
  workspace,
  COUNT(*) as member_count
FROM "January_2025"
WHERE workspace IS NOT NULL
GROUP BY workspace
ORDER BY member_count DESC;

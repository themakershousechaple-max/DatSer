-- ============================================
-- WORKSPACE FILTERING - SQL CHEAT SHEET
-- ============================================
-- Quick reference queries for filtering data by workspace name in Supabase
-- Copy and paste these into the Supabase SQL Editor

-- ============================================
-- 1. VIEW YOUR WORKSPACE INFO
-- ============================================

-- See your current workspace name
SELECT 
    email,
    workspace_name,
    created_at as account_created
FROM user_preferences up
JOIN auth.users u ON up.user_id = u.id
WHERE u.id = auth.uid();


-- ============================================
-- 2. VIEW ALL MEMBERS WITH WORKSPACE CONTEXT
-- ============================================

-- December 2025 members with workspace names
SELECT 
    "Full Name" as member_name,
    "Phone Number" as phone,
    Gender as gender,
    user_email,
    workspace_name
FROM december_2025_with_workspace
ORDER BY workspace_name, "Full Name";


-- Filter December 2025 by specific workspace
SELECT 
    "Full Name" as member_name,
    "Phone Number" as phone,
    user_email,
    workspace_name
FROM december_2025_with_workspace
WHERE workspace_name = 'TMH Teen Ministry'
ORDER BY "Full Name";


-- Count members per workspace (December 2025)
SELECT 
    workspace_name,
    COUNT(*) as total_members
FROM december_2025_with_workspace
GROUP BY workspace_name
ORDER BY total_members DESC;


-- ============================================
-- 3. VIEW MONTHLY TABLES BY WORKSPACE
-- ============================================

-- See all monthly tables with workspace context
SELECT 
    table_name,
    month_year,
    user_email,
    workspace_name,
    created_at
FROM monthly_tables_with_workspace
ORDER BY workspace_name, created_at DESC;


-- Filter tables by specific workspace
SELECT 
    table_name,
    month_year,
    created_at
FROM monthly_tables_with_workspace
WHERE workspace_name = 'TMH Teen Ministry'
ORDER BY created_at DESC;


-- Count tables per workspace
SELECT 
    workspace_name,
    COUNT(*) as table_count,
    array_agg(DISTINCT month_year) as months
FROM monthly_tables_with_workspace
GROUP BY workspace_name;


-- ============================================
-- 4. FIND ALL WORKSPACES
-- ============================================

-- List all unique workspace names
SELECT DISTINCT 
    workspace_name,
    COUNT(*) OVER (PARTITION BY workspace_name) as user_count
FROM user_preferences
ORDER BY workspace_name;


-- Workspace directory with user details
SELECT 
    up.workspace_name,
    u.email as user_email,
    u.created_at as user_joined,
    COUNT(DISTINCT umt.table_name) as monthly_tables
FROM user_preferences up
JOIN auth.users u ON up.user_id = u.id
LEFT JOIN user_month_tables umt ON u.id = umt.user_id
GROUP BY up.workspace_name, u.email, u.created_at
ORDER BY up.workspace_name, u.created_at;


-- ============================================
-- 5. WORKSPACE STATISTICS
-- ============================================

-- Complete workspace overview
SELECT 
    up.workspace_name,
    u.email,
    COUNT(DISTINCT d.id) as december_members,
    COUNT(DISTINCT umt.table_name) as monthly_tables
FROM user_preferences up
JOIN auth.users u ON up.user_id = u.id
LEFT JOIN "December_2025" d ON u.id = d.user_id
LEFT JOIN user_month_tables umt ON u.id = umt.user_id
GROUP BY up.workspace_name, u.email
ORDER BY up.workspace_name;


-- Attendance summary by workspace (December 2025)
SELECT 
    workspace_name,
    COUNT(*) as total_members,
    COUNT(CASE WHEN "attendance_1st" = 'Present' THEN 1 END) as present_1st,
    COUNT(CASE WHEN "attendance_7th" = 'Present' THEN 1 END) as present_7th,
    COUNT(CASE WHEN "attendance_14th" = 'Present' THEN 1 END) as present_14th,
    COUNT(CASE WHEN "attendance_21st" = 'Present' THEN 1 END) as present_21st
FROM december_2025_with_workspace
GROUP BY workspace_name;


-- ============================================
-- 6. SEARCH AND FILTER
-- ============================================

-- Search members by name across all workspaces
SELECT 
    "Full Name" as member_name,
    workspace_name,
    user_email,
    "Phone Number" as phone
FROM december_2025_with_workspace
WHERE "Full Name" ILIKE '%angela%'
ORDER BY workspace_name, "Full Name";


-- Find members in a specific workspace with a specific name
SELECT 
    "Full Name" as member_name,
    "Phone Number" as phone,
    Gender as gender,
    workspace_name
FROM december_2025_with_workspace
WHERE workspace_name = 'TMH Teen Ministry'
  AND "Full Name" ILIKE '%john%'
ORDER BY "Full Name";


-- ============================================
-- 7. DATA EXPORT QUERIES
-- ============================================

-- Export all December 2025 data for a specific workspace (CSV friendly)
SELECT 
    "Full Name",
    Gender,
    "Phone Number",
    Age,
    "Current Level",
    "Parent Name 1",
    "Parent Phone 1",
    workspace_name,
    user_email
FROM december_2025_with_workspace
WHERE workspace_name = 'TMH Teen Ministry'
ORDER BY "Full Name";


-- Export workspace directory (CSV friendly)
SELECT 
    workspace_name,
    user_email,
    COUNT(DISTINCT umt.table_name) as total_months
FROM user_preferences up
JOIN auth.users u ON up.user_id = u.id
LEFT JOIN user_month_tables umt ON u.id = umt.user_id
GROUP BY workspace_name, user_email
ORDER BY workspace_name;


-- ============================================
-- 8. ADMIN QUERIES
-- ============================================

-- Get user ID and workspace for a specific email
SELECT 
    u.id as user_id,
    u.email,
    up.workspace_name,
    u.created_at as joined_date
FROM auth.users u
LEFT JOIN user_preferences up ON u.id = up.user_id
WHERE u.email = 'diallobeniah@gmail.com';


-- Helper function usage: Get workspace info for a user
SELECT * FROM get_user_workspace('13af4f11-204b-4fe2-86f0-bd3306cfcac6');


-- Find orphaned data (members without workspace assigned)
SELECT 
    d."Full Name",
    d.user_id,
    u.email
FROM "December_2025" d
LEFT JOIN auth.users u ON d.user_id = u.id
LEFT JOIN user_preferences up ON d.user_id = up.user_id
WHERE up.workspace_name IS NULL;


-- ============================================
-- 9. UPDATE QUERIES (USE WITH CAUTION!)
-- ============================================

-- Update workspace name for your account
UPDATE user_preferences
SET 
    workspace_name = 'Your New Workspace Name',
    updated_at = now()
WHERE user_id = auth.uid();


-- Reassign all data from one workspace to another
-- (DANGEROUS - use with extreme caution!)
-- UPDATE user_preferences
-- SET workspace_name = 'New Workspace Name'
-- WHERE workspace_name = 'Old Workspace Name';


-- ============================================
-- 10. TROUBLESHOOTING
-- ============================================

-- Check if workspace_name column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND column_name = 'workspace_name';


-- Verify views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%workspace%';


-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'user_preferences';


-- ============================================
-- NOTES
-- ============================================
-- • Replace 'TMH Teen Ministry' with your actual workspace name
-- • Replace '13af4f11-204b-4fe2-86f0-bd3306cfcac6' with actual user IDs
-- • auth.uid() returns the currently logged-in user's ID
-- • All queries respect Row Level Security (RLS) policies
-- • Use ILIKE for case-insensitive searching
-- • Always test UPDATE queries with SELECT first!
-- ============================================

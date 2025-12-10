# 🚨 IMPORTANT: Run This SQL in Supabase First!

## Error You're Getting:
```
Failed to create new month: Could not find the function public.create_month_from_current
```

## Why?
The database function doesn't exist yet. You need to create it in Supabase.

## Quick Fix (3 Steps):

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Copy & Paste This SQL
Copy ALL the code below and paste it into the SQL Editor:

```sql
-- Create function to copy month table with new attendance columns
CREATE OR REPLACE FUNCTION create_month_from_current(
  source_table TEXT,
  new_table_name TEXT,
  sunday_dates TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_name TEXT;
  attendance_column TEXT;
  sunday_date TEXT;
  members_copied INTEGER := 0;
  result JSON;
BEGIN
  -- Step 1: Create the new table structure by copying from source table (without data)
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I (LIKE %I INCLUDING ALL)', new_table_name, source_table);
  
  -- Step 2: Drop all existing attendance columns (columns starting with 'attendance_')
  FOR column_name IN 
    SELECT c.column_name
    FROM information_schema.columns c
    WHERE c.table_name = new_table_name
      AND c.column_name LIKE 'attendance_%'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS %I', new_table_name, column_name);
  END LOOP;
  
  -- Step 3: Add new attendance columns for each Sunday date
  FOREACH sunday_date IN ARRAY sunday_dates
  LOOP
    -- Format: attendance_2025_01_05 for date 2025-01-05
    attendance_column := 'attendance_' || REPLACE(sunday_date, '-', '_');
    
    -- Add the attendance column (TEXT type to store 'Present', 'Absent', or NULL)
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I TEXT', new_table_name, attendance_column);
    
    RAISE NOTICE 'Created attendance column: %', attendance_column;
  END LOOP;
  
  -- Step 4: Copy all member data from source table (excluding old attendance columns)
  DECLARE
    copy_columns TEXT;
  BEGIN
    SELECT string_agg(quote_ident(column_name), ', ')
    INTO copy_columns
    FROM information_schema.columns
    WHERE table_name = source_table
      AND column_name NOT LIKE 'attendance_%';
    
    -- Copy the data
    EXECUTE format(
      'INSERT INTO %I (%s) SELECT %s FROM %I',
      new_table_name,
      copy_columns,
      copy_columns,
      source_table
    );
    
    -- Get count of copied members
    EXECUTE format('SELECT COUNT(*) FROM %I', new_table_name) INTO members_copied;
  END;
  
  -- Step 5: Return result as JSON
  result := json_build_object(
    'success', true,
    'table_name', new_table_name,
    'source_table', source_table,
    'members_copied', members_copied,
    'attendance_columns_created', array_length(sunday_dates, 1),
    'sunday_dates', sunday_dates
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating month table: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_month_from_current(TEXT, TEXT, TEXT[]) TO authenticated;
```

### Step 3: Run It!
1. Click the **"Run"** button (or press `Ctrl+Enter`)
2. You should see: **"Success. No rows returned"**
3. Done! ✅

## Test It
Now go back to your app and try creating a new month. It should work!

## What This Does
- Creates a database function that copies your current month's members
- Removes old attendance columns
- Adds new attendance columns for the new month's Sundays
- Preserves all member data (names, phones, etc.)

## Still Having Issues?
If you get an error when running the SQL:
1. Make sure you're in the correct Supabase project
2. Check that you have admin/owner permissions
3. Try running it again (it's safe to run multiple times)

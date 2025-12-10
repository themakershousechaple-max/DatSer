# Setup: Create Month from Current Function

## Overview
This feature allows you to create a new month table that:
1. **Copies all member data** (names, phone numbers, ages, levels, etc.) from the current month
2. **Creates new attendance columns** matching the Sundays in the new month
3. **Automatically switches** to the new month after creation

## Setup Instructions

### Step 1: Run the SQL Migration in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Open the file `supabase_migration_create_month_from_current.sql`
4. Copy the entire SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the migration

### Step 2: Verify the Function

After running the migration, verify the function was created:

```sql
-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'create_month_from_current';
```

### Step 3: Test the Function (Optional)

You can test the function manually:

```sql
-- Example: Create January 2025 from October 2024
SELECT create_month_from_current(
  'October_2024',                    -- Source table (current month)
  'January_2025',                     -- New table name
  ARRAY[                              -- Sunday dates for January 2025
    '2025-01-05',
    '2025-01-12',
    '2025-01-19',
    '2025-01-26'
  ]
);
```

## How It Works

### Frontend (React)
When a user clicks "Create Month" in the UI:
1. User selects a month and year
2. App calculates all Sundays in that month
3. Calls `createNewMonth()` function with:
   - Month number (1-12)
   - Year (e.g., 2025)
   - Month name (e.g., "January")
   - Array of Sunday dates

### Backend (Supabase Function)
The `create_month_from_current` function:
1. **Creates new table** with same structure as source table
2. **Drops old attendance columns** (from source month)
3. **Adds new attendance columns** for each Sunday in the new month
   - Format: `attendance_2025_01_05` for date 2025-01-05
4. **Copies all member data** (excluding old attendance data)
5. **Returns result** with count of members copied

### Example Result

```json
{
  "success": true,
  "table_name": "January_2025",
  "source_table": "October_2024",
  "members_copied": 150,
  "attendance_columns_created": 4,
  "sunday_dates": [
    "2025-01-05",
    "2025-01-12",
    "2025-01-19",
    "2025-01-26"
  ]
}
```

## What Gets Copied

### ✅ Copied from Current Month
- Full names
- Phone numbers
- Ages
- Gender
- Current level (education)
- Parent information
- All other member fields

### ❌ NOT Copied
- Old attendance data (Present/Absent records)
- Old attendance columns

### ✨ Newly Created
- Fresh attendance columns for the new month's Sundays
- All attendance starts as `NULL` (not marked)

## User Experience

1. User opens menu → "Create New Month"
2. Selects month (e.g., January) and year (e.g., 2025)
3. Sees preview of Sunday dates
4. Clicks "Create Month"
5. App shows success message: "Month January 2025 created successfully! Copied 150 members from October_2024."
6. Automatically switches to the new month
7. All members are there with empty attendance ready to mark

## Troubleshooting

### Error: "function create_month_from_current does not exist"
- **Solution**: Run the SQL migration in Supabase SQL Editor

### Error: "permission denied for function"
- **Solution**: Make sure the GRANT statement ran:
  ```sql
  GRANT EXECUTE ON FUNCTION create_month_from_current(TEXT, TEXT, TEXT[]) TO authenticated;
  ```

### Error: "relation [table_name] already exists"
- **Solution**: The month table already exists. Either:
  - Delete the existing table first (if you want to recreate it)
  - Choose a different month/year combination

### No members copied (members_copied: 0)
- **Solution**: Check that your current month table has members:
  ```sql
  SELECT COUNT(*) FROM October_2024;
  ```

## Notes

- The function uses `SECURITY DEFINER` to run with elevated privileges
- Only authenticated users can execute the function
- The function is idempotent for column creation (uses `IF NOT EXISTS`)
- All operations are wrapped in a transaction (rolls back on error)

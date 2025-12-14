# 🔐 User Isolation Setup Guide

## What This Does
This guide will set up your database so that:
- ✅ Each user only sees **their own members** and data
- ✅ Users can **share access** with collaborators (existing feature)
- ✅ New users start with a **clean, empty dashboard**
- ✅ Login/logout works like Google Chrome (remembers your data)

---

## 📋 Prerequisites
- ✅ You have Supabase authentication working (Google + Email/Password)
- ✅ You have at least one monthly table (e.g., `December_2025`)
- ✅ You're logged into your Supabase dashboard

---

## 🚀 Step-by-Step Instructions

### **Step 1: Open Supabase SQL Editor**
1. Go to your Supabase project dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### **Step 2: Run the Migration Script**
1. Open the file: `sql/user_isolation_setup.sql`
2. Copy the **entire contents** of that file
3. Paste it into the Supabase SQL Editor
4. **IMPORTANT**: Edit the script to include ALL your monthly tables:
   - Find the section that says `ALTER TABLE "December_2025"`
   - Uncomment and add lines for each month you have (January_2026, February_2026, etc.)
5. Click **"Run"** at the bottom right

### **Step 3: Assign Existing Data to Your Account** (Optional)
If you already have members in your database:

1. Get your user ID by running this query:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```
   Copy the `id` value (it's a long UUID like `a1b2c3d4-...`)

2. Update existing members to belong to you:
   ```sql
   UPDATE "December_2025" SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
   ```
   Replace `YOUR_USER_ID_HERE` with the ID from step 1

3. Repeat for each monthly table you have

### **Step 4: Verify the Setup**
Run these queries to make sure everything worked:

```sql
-- Check if user_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'December_2025' AND column_name = 'user_id';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'December_2025';

-- Check policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'December_2025';
```

You should see:
- ✅ `user_id` column exists (type: `uuid`)
- ✅ `rowsecurity` is `true`
- ✅ 4 policies listed (view, insert, update, delete)

---

## 🎯 What Happens Next

### **For Existing Users:**
- Your existing data will be linked to your account
- You'll only see your own members
- Everything else works the same

### **For New Users:**
- They sign up with email/password or Google
- They see an empty dashboard
- They create their first month table
- They add members (automatically linked to their account)
- They can share access with others via the "Share Access" button

### **Collaboration:**
- The existing "Share Access" feature still works!
- Users can invite collaborators by email
- Collaborators can view and edit shared data

---

## ⚠️ Important Notes

1. **Run this ONCE per Supabase project**
2. **Backup your data first** (optional but recommended)
3. **For new monthly tables**: Use the helper function:
   ```sql
   SELECT create_monthly_table_rls_policies('NewMonth_2026');
   ```

---

## 🐛 Troubleshooting

### Problem: "relation does not exist"
- **Solution**: Make sure you're using the exact table name (case-sensitive!)
- Check your table names in Supabase Table Editor

### Problem: "permission denied"
- **Solution**: Make sure you're running the SQL as the project owner
- Check that you're in the correct Supabase project

### Problem: Users can't see any data
- **Solution**: Make sure you assigned existing data to user accounts (Step 3)
- Check that `user_id` is not NULL for existing records

---

## ✅ Done!
Once you've completed these steps, come back and let me know.
I'll then update the frontend code to filter by `user_id`.

---

## 📞 Need Help?
If you get stuck, share:
1. The error message you're seeing
2. Which step you're on
3. A screenshot of your Supabase SQL Editor (if possible)

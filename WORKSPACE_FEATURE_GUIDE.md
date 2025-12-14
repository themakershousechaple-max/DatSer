# 🏢 Workspace Name Feature Guide

## Overview
The Workspace Name feature allows you to give your organization a unique identifier that makes it easy to filter and manage data in Supabase's backend.

---

## ✅ What's Been Set Up

### 1. Database Changes
- ✅ Added `workspace_name` column to `user_preferences` table
- ✅ Set your workspace name to: **"TMH Teen Ministry"**
- ✅ Created database views for easy backend filtering
- ✅ Added helper functions for workspace queries

### 2. Application Features
- ✅ **Workspace Settings Modal** - Accessible from Admin Panel
- ✅ **Edit Workspace Name** - Users can update their workspace name anytime
- ✅ **Character Limit** - 50 characters maximum
- ✅ **Professional UI** - Clean, user-friendly interface

---

## 🎯 How to Use

### For End Users:

1. **Access Workspace Settings**
   - Go to Admin Panel
   - Click the green **"Workspace"** button in the header
   - The Workspace Settings modal will open

2. **Set Your Workspace Name**
   - Enter your organization name (e.g., "Grace Church Youth", "Teen Center NYC")
   - Click **"Save Changes"**
   - Your workspace name is now saved!

3. **What Happens Next?**
   - All your data will be associated with this workspace name
   - When you view data in Supabase, you can filter by workspace name
   - Makes backend management much easier

---

## 📊 Backend Queries (For Administrators)

### View All Members with Workspace Names (December 2025)
```sql
SELECT * FROM december_2025_with_workspace;
```

This will show:
- Member details
- User email
- Workspace name

### Filter by Specific Workspace
```sql
SELECT * 
FROM december_2025_with_workspace 
WHERE workspace_name = 'TMH Teen Ministry';
```

### View All Monthly Tables with Workspace Context
```sql
SELECT * FROM monthly_tables_with_workspace;
```

### Get Workspace Info for a Specific User
```sql
SELECT * FROM get_user_workspace('13af4f11-204b-4fe2-86f0-bd3306cfcac6');
```
Replace the UUID with any user's ID.

### Find All Users in a Workspace
```sql
SELECT 
    u.email,
    up.workspace_name,
    COUNT(d.id) as member_count
FROM auth.users u
LEFT JOIN user_preferences up ON u.id = up.user_id
LEFT JOIN "December_2025" d ON u.id = d.user_id
WHERE up.workspace_name = 'TMH Teen Ministry'
GROUP BY u.email, up.workspace_name;
```

### List All Workspaces
```sql
SELECT DISTINCT workspace_name, COUNT(*) as user_count
FROM user_preferences
GROUP BY workspace_name
ORDER BY workspace_name;
```

---

## 🛠️ Technical Details

### Database Schema

**user_preferences table** (updated):
```sql
- id: UUID
- user_id: UUID (references auth.users)
- workspace_name: TEXT (default: 'My Organization')
- selected_month_table: TEXT
- selected_attendance_date: TEXT
- badge_filter: JSONB
- dashboard_tab: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Database Views Created

1. **december_2025_with_workspace**
   - Joins December_2025 with user info and workspace names
   - Makes it easy to see which workspace each member belongs to

2. **monthly_tables_with_workspace**
   - Shows all monthly tables with workspace context
   - Helps identify which months belong to which workspace

### Helper Function

**get_user_workspace(user_id UUID)**
- Returns user email, workspace name, and user ID
- Useful for quick lookups

---

## 💡 Use Cases

### 1. Multi-Organization Backend Support
If you're managing multiple churches/organizations from one Supabase project:
- Each organization sets a unique workspace name
- Filter by workspace name in Supabase SQL Editor
- Easy to separate and manage data

### 2. Database Maintenance
When you need to:
- Export data for a specific organization
- Check member counts per organization
- Troubleshoot issues for a specific workspace

### 3. Reporting & Analytics
Generate reports by workspace:
```sql
SELECT 
    up.workspace_name,
    COUNT(DISTINCT d.id) as total_members,
    COUNT(DISTINCT CASE WHEN d.attendance_30th = 'Present' THEN d.id END) as present_count
FROM user_preferences up
LEFT JOIN "December_2025" d ON up.user_id = d.user_id
GROUP BY up.workspace_name;
```

---

## 🔐 Security

- ✅ **RLS (Row Level Security)** is still enforced
- ✅ Users can only see their own data
- ✅ Workspace names are for backend identification only
- ✅ No cross-workspace data leakage

---

## 🎨 UI/UX Features

### Workspace Settings Modal

**Location:** Admin Panel → "Workspace" button (green)

**Features:**
- Clean, professional design
- Info box explaining what workspace names are
- Character counter (50 max)
- Displays current user email
- Save/Cancel buttons
- Loading states
- Success/Error notifications

**Responsive:**
- Works on mobile, tablet, and desktop
- Touch-friendly buttons
- Adaptive layouts

---

## 📝 Common Tasks

### Change Your Workspace Name
1. Click "Workspace" button in Admin Panel
2. Edit the workspace name
3. Click "Save Changes"

### View Your Current Workspace Name (Backend)
```sql
SELECT workspace_name 
FROM user_preferences 
WHERE user_id = auth.uid();
```

### See All Data for Your Workspace
```sql
-- For December 2025
SELECT * FROM december_2025_with_workspace 
WHERE user_id = auth.uid();
```

---

## 🚀 Next Steps

1. **Set Your Workspace Name** (if not already set)
   - Default is "TMH Teen Ministry" for diallobeniah@gmail.com
   - You can change it anytime

2. **Try the Queries** in Supabase SQL Editor
   - Familiarize yourself with the views
   - Practice filtering by workspace name

3. **Share with Collaborators**
   - When you invite collaborators, they'll see the same workspace name
   - Helps them understand which organization they're working with

---

## 🆘 Troubleshooting

**Workspace Settings Modal Won't Open?**
- Make sure you're logged in
- Check browser console for errors
- Refresh the page and try again

**Can't Save Workspace Name?**
- Ensure the name is not empty
- Check that you're authenticated
- Verify Supabase connection

**Workspace Name Not Showing in Queries?**
- Make sure you've saved it in the UI first
- Check that `workspace_name` column exists in user_preferences
- Run: `SELECT * FROM user_preferences WHERE user_id = auth.uid();`

---

## ✨ Benefits

✅ **Easy Backend Filtering** - No more confusion about which data belongs to whom
✅ **Professional** - Much better than "User A", "User B" tags
✅ **Scalable** - Works for 1 user or 100 users
✅ **Flexible** - Users can change their workspace name anytime
✅ **Compatible** - Works with existing multi-tenant architecture

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify database migrations were applied successfully
3. Check browser console for error messages
4. Review Supabase logs

---

**Last Updated:** December 14, 2025
**Feature Status:** ✅ Fully Implemented & Tested

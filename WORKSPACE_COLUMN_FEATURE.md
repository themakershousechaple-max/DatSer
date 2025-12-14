# ✅ Workspace Column Feature - Complete Guide

## 🎯 Features Implemented

1.  **Separate Workspaces:** Each user has their own "Workspace Name" (e.g., "TMH Teen Ministry", "4-5 years class").
2.  **Auto-Fill:** New members automatically get assigned your current workspace name.
3.  **Filtering:** Easily filter data by workspace in Supabase.
4.  **Batch Updates:** Changing your workspace name automatically updates ALL your member records.
5.  **Data Isolation:** Deleting a user account automatically deletes all their member data (Cascade Delete).
6.  **Backfill:** Existing data is automatically assigned to your workspace.

---

## 📋 One-Time Setup Instructions

You need to run two SQL migrations in Supabase to enable these features.

### **Step 1: Open Supabase SQL Editor**
1.  Go to **Supabase Dashboard** → **SQL Editor**
2.  Click **"New query"**

### **Step 2: Run Migration 1 (Add Column)**
*Use this if you haven't added the workspace column yet.*

1.  Copy the code from: `sql/add_workspace_column_migration.sql`
2.  Paste into SQL Editor
3.  Click **Run**

### **Step 3: Run Migration 2 (Add Advanced Features)**
*Use this to enable Batch Updates and Cascade Delete.*

1.  Copy the code from: `sql/complete_workspace_features.sql`
2.  Paste into SQL Editor
3.  Click **Run**

---

## 🎨 How It Works in the App

### **1. Setting Your Workspace Name**
- Go to **Admin Panel** → **Workspace Settings**
- Enter your name (e.g., "Primary School")
- Click **Save**
- **Result:**
  - Updates your preference
  - **Updates ALL existing members** in all monthly tables to "Primary School"

### **2. Adding New Members**
- User creates a new member
- System checks your Workspace Name
- Automatically saves member with `workspace: "Primary School"`

### **3. Filtering Data (in Supabase)**
- Go to **Table Editor**
- Filter by `workspace = 'Primary School'`
- You only see your members!

---

## 🔍 Verification Queries

### **Check Workspace Column**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'January_2025' AND column_name = 'workspace';
```

### **Check Member Distribution**
```sql
SELECT workspace, COUNT(*) 
FROM "January_2025" 
GROUP BY workspace;
```

### **Test Batch Update (Manual SQL Check)**
Change workspace in App, then run:
```sql
SELECT workspace, COUNT(*) 
FROM "January_2025" 
WHERE user_id = auth.uid()
GROUP BY workspace;
```

---

## 🔧 Troubleshooting

- **Error: "function update_user_workspace_name does not exist"**
  - **Solution:** Run Migration 2 (`sql/complete_workspace_features.sql`)

- **Error: "column workspace does not exist"**
  - **Solution:** Run Migration 1 (`sql/add_workspace_column_migration.sql`)

- **Members have NULL workspace?**
  - **Solution:** Go to App → Workspace Settings → Click Save. This forces a re-sync of all records.

---

## 🚀 Summary of Files
- `sql/add_workspace_column_migration.sql`: Adds column & indexes
- `sql/complete_workspace_features.sql`: Adds batch update & cascade delete
- `src/context/AppContext.jsx`: Logic for auto-fill & batch updates
- `src/components/WorkspaceSettingsModal.jsx`: UI for updating workspace

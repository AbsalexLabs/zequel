# SQL Setup Instructions - Quick Start

## What's Ready

I've created all the SQL scripts and documentation needed to set up your Zequel database. Here's what you have:

### Files Created

1. **sql/001_create_tables.sql** (250 lines)
   - Complete database schema
   - All 12 required tables
   - Row Level Security (RLS) policies
   - Automatic triggers for user setup
   - Performance indexes

2. **sql/README.md**
   - Details about each migration
   - Multiple ways to run migrations
   - Troubleshooting guide

3. **SETUP_GUIDE.md**
   - Complete step-by-step setup guide
   - Table descriptions
   - Security features explained
   - Testing checklist

4. **DATABASE_SCHEMA.md**
   - Quick reference for all tables
   - Column definitions
   - Relationships
   - Helpful SQL queries

5. **scripts/setup-db.ts**
   - TypeScript script to run migrations programmatically
   - Can be used in CI/CD pipelines

---

## Tables Included

### User & Auth
- ✅ profiles
- ✅ preferences
- ✅ subscriptions
- ✅ otp_codes (for signup/password reset)

### Content & Conversations
- ✅ documents (uploaded files)
- ✅ conversations (chat sessions)
- ✅ messages (individual messages)
- ✅ queries (research queries)

### System & Logging
- ✅ ai_usage_logs (API usage tracking)
- ✅ rate_limit_violations (rate limiting)
- ✅ system_settings (global config)
- ✅ admin_audit_logs (admin actions)

---

## How to Run the Migrations

### **Method 1: Supabase Dashboard (Recommended) ⭐**

1. Go to https://app.supabase.com
2. Select your Zequel project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open `/sql/001_create_tables.sql` in your editor
6. Copy ALL content
7. Paste into the Supabase SQL editor
8. Click **Run** (blue button)
9. Wait for completion ✅

**Time needed:** ~2 minutes

---

### Method 2: Using v0 UI Assistant

If you have Supabase MCP enabled in v0:
- Ask the assistant to "run the SQL migrations using Supabase tools"
- The assistant can execute them directly

---

### Method 3: Supabase CLI

```bash
# Make sure you're in the project directory
cd /path/to/zequel

# Link your Supabase project (one time)
supabase link --project-ref your_project_ref

# Push the migrations
supabase db push sql/001_create_tables.sql
```

---

## Verification Checklist

After running migrations, verify success:

### ✅ Check Table Existence

In Supabase SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these 12 tables:
```
admin_audit_logs
ai_usage_logs
conversations
documents
messages
otp_codes
preferences
profiles
queries
rate_limit_violations
subscriptions
system_settings
```

### ✅ Test OTP Functionality

Try signing up at `/auth/sign-up`:
1. Enter email and password
2. Should generate OTP
3. Check if OTP appears in `otp_codes` table:
   ```sql
   SELECT * FROM otp_codes 
   WHERE email = 'your@email.com' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

### ✅ Test Document Upload

1. Go to workspace
2. Upload a PDF
3. Check `documents` table:
   ```sql
   SELECT id, title, status FROM documents 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

### ✅ Test Chat

1. Create a new conversation
2. Send a message
3. Check `conversations` and `messages` tables

---

## What Happens After Setup

Once migrations run successfully:

1. **Users** can sign up with OTP verification
2. **Documents** can be uploaded and extracted
3. **Conversations** can be created and messages saved
4. **AI usage** is automatically logged
5. **Rate limits** are enforced per endpoint
6. **Admin** can track all actions

All data is secured with Row Level Security (RLS):
- Users see only their own data
- Each database operation checks permissions
- No cross-user data leakage possible

---

## Troubleshooting

### ❌ "Table already exists"
This is normal - the SQL uses `IF NOT EXISTS`. Safe to re-run.

### ❌ "Permission denied"
Make sure you:
- Are logged in as project owner/admin in Supabase
- Using the correct project

### ❌ "Syntax error in SQL"
- Try running smaller chunks instead of entire script
- Supabase might have size limits on single queries
- Create multiple queries if needed

### ❌ "Schema doesn't exist"
The Zequel app uses the default `public` schema which is created automatically. Check that you're in the right project.

### ❌ "Failed to generate code" on signup
The `otp_codes` table wasn't created. Re-run migrations.

### ❌ "No such table: documents"
One or more tables failed to create. Check Supabase logs and re-run the full migration.

---

## Next Steps

1. ⭕ Run the migrations (pick a method above)
2. ⭕ Verify tables were created
3. ⭕ Test signup with `/auth/sign-up`
4. ⭕ Upload a document
5. ⭕ Create a conversation and chat
6. ⭕ Check admin panel at `/settings/admin`

---

## File Locations in Your Project

```
zequel/
├── sql/
│   ├── 001_create_tables.sql    ← Run this
│   └── README.md                ← Migration docs
├── scripts/
│   └── setup-db.ts              ← Optional: Node script
├── SETUP_GUIDE.md               ← Detailed guide
├── DATABASE_SCHEMA.md           ← Table reference
└── SQL_SETUP_INSTRUCTIONS.md    ← This file
```

---

## Questions?

- **Setup Guide:** See `SETUP_GUIDE.md` for detailed walkthrough
- **Table Details:** See `DATABASE_SCHEMA.md` for all columns/types
- **Troubleshooting:** See `sql/README.md` for common issues

---

**Ready? Let's go! 🚀**

**Start here:** Open your Supabase dashboard and run `/sql/001_create_tables.sql`

# Zequel - Database Setup Guide

## Overview

Zequel requires a Supabase database with specific tables. This guide walks you through setting up your database schema.

## Prerequisites

- ✅ Supabase integration connected in v0
- ✅ `NEXT_PUBLIC_SUPABASE_URL` environment variable set
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable set

## Quick Setup (Recommended)

### Step 1: Copy the SQL

Open `/sql/001_create_tables.sql` in your project and copy all the content.

### Step 2: Run in Supabase Dashboard

1. Go to your Supabase project: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query** (or paste in the query editor)
5. Paste the entire SQL content
6. Click **Run** (blue button)

You should see messages like:
```
CREATE TABLE
CREATE POLICY
CREATE TRIGGER
CREATE INDEX
```

### Step 3: Verify

Run this query to verify tables were created:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 12 tables:
- admin_audit_logs
- ai_usage_logs
- conversations
- documents
- messages
- otp_codes
- preferences
- profiles
- queries
- rate_limit_violations
- subscriptions
- system_settings

## Tables Overview

### Core User Tables

**profiles** - User profile information
- `id` - User ID (from auth.users)
- `username` - Optional username
- `full_name` - User's full name
- `avatar_url` - Profile picture URL
- Auto-created when user signs up

**preferences** - User settings
- `theme` - Light/dark/auto
- `notifications_enabled` - Boolean flag
- Auto-created when user signs up

**subscriptions** - Subscription/billing info
- `plan` - free/pro/enterprise
- `status` - active/cancelled/expired
- Stripe integration fields
- Auto-created when user signs up

### Content Tables

**documents** - User uploaded files
- `title` - Document name
- `file_path` - Storage path
- `extracted_text` - OCR/text extraction
- `status` - processing/parsed/failed

**conversations** - Chat sessions
- `title` - Conversation name
- `document_id` - Linked document (optional)
- `updated_at` - Last message time

**messages** - Chat messages
- `conversation_id` - Parent conversation
- `role` - user/assistant
- `content` - Message text

**queries** - Research queries
- `document_id` - Linked document
- `query_text` - The search/query
- `result` - Query result
- `status` - pending/completed/failed

### System Tables

**otp_codes** - One-Time Passwords
- Used for signup email verification
- Used for password reset
- Auto-purges after expiration

**ai_usage_logs** - API usage tracking
- `model` - Which AI model was used
- `input_tokens` - Tokens consumed
- `status` - success/error/rate_limited

**rate_limit_violations** - Rate limiting
- Tracks API rate limit hits
- `reset_at` - When limit resets

**system_settings** - Global config
- Key-value store for admin settings
- Not subject to Row Level Security

**admin_audit_logs** - Admin actions
- Logs all admin operations
- For compliance and debugging

## Security Features

### Row Level Security (RLS)

All user-facing tables have RLS enabled. This means:
- Users can only see their own data
- Users can only modify their own documents, conversations, etc.
- The database enforces security at the row level

Example policy: Users can select their own conversations:
```sql
SELECT * FROM conversations WHERE user_id = auth.uid()
```

### Automatic Profile Creation

When a user signs up via `auth.signUp()`:
1. User record is created in `auth.users`
2. Trigger fires automatically
3. New rows are created in:
   - `profiles` (empty, user can fill in details)
   - `preferences` (default settings)
   - `subscriptions` (free plan)

No manual insertion needed!

## Common Issues & Solutions

### "Table already exists" Error

**This is normal.** The SQL uses `CREATE TABLE IF NOT EXISTS` so it's safe to re-run.

### "Permission denied" Error

Make sure you're:
- Logged into Supabase as an admin/owner
- Not using a restricted API key

### "Failed to generate code" on Signup

This means the `otp_codes` table doesn't exist yet. Run the migrations.

### "Failed to create conversation"

This means the `conversations` or `messages` table is missing. Verify migrations ran.

### Slow Document Extraction

Large PDFs need time to extract text. The `documents.status` field tracks progress:
- `processing` - Currently extracting
- `parsed` - Complete, text ready
- `failed` - Extraction error

## Testing

After setup, test these features:

1. **Signup with OTP**
   - Go to `/auth/sign-up`
   - Enter email and password
   - Should send OTP code
   - Verify the `otp_codes` table has entries

2. **Create Document**
   - Upload a PDF document
   - Should create row in `documents` table
   - `status` changes from `processing` to `parsed`

3. **Chat**
   - Create a new conversation
   - Send a message
   - Should appear in `messages` table
   - With `role: 'user'`

4. **Admin Panel**
   - Check Admin > Users
   - Should show user profiles and subscription info
   - Check Admin > AI Usage for API logs

## Advanced: Custom RLS Policies

Need to modify RLS? Edit the policies in Supabase SQL Editor:

```sql
-- Example: Allow users to share documents with others
CREATE POLICY "shared_documents" ON public.documents
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT owner_id FROM document_shares WHERE shared_with = auth.uid())
  );
```

## Next Steps

1. ✅ Run migrations (you're here!)
2. ⭕ Verify tables exist in Supabase dashboard
3. ⭕ Test signup flow at `/auth/sign-up`
4. ⭕ Upload a document in workspace
5. ⭕ Create a conversation and chat

## Getting Help

- Check `/sql/README.md` for migration details
- Check Supabase docs: https://supabase.com/docs
- Check your Supabase project logs for errors

---

**Happy building! 🚀**

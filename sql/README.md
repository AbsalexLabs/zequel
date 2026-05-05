# Database Migrations for Zequel

This directory contains SQL migration scripts that set up the Zequel database schema.

## Available Migrations

- **001_create_tables.sql** - Creates all core tables:
  - `profiles` - User profile information
  - `otp_codes` - One-time passwords for signup/reset
  - `documents` - User uploaded documents
  - `conversations` - Chat conversations
  - `messages` - Chat messages
  - `queries` - Research queries
  - `preferences` - User preferences
  - `subscriptions` - Subscription data
  - `ai_usage_logs` - AI API usage tracking
  - `rate_limit_violations` - Rate limit tracking
  - `system_settings` - Global system settings
  - `admin_audit_logs` - Admin action audit logs

## How to Run Migrations

### Option 1: Using Supabase Dashboard (Recommended for Initial Setup)

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Click **New Query**
4. Copy the entire content of `001_create_tables.sql`
5. Paste it into the SQL editor
6. Click **Run**

### Option 2: Using v0 UI with Supabase Integration

If you have Supabase MCP connected in v0:
- Ask the assistant to run the SQL migrations using the Supabase tools
- The assistant can execute the SQL directly through the integration

### Option 3: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Set your Supabase project credentials
supabase link --project-ref YOUR_PROJECT_ID

# Run the migration
supabase db push sql/001_create_tables.sql
```

## Schema Highlights

### Row Level Security (RLS)
- All user-data tables have RLS enabled
- Users can only see/modify their own data
- Admin tables (system_settings, admin_audit_logs) have no RLS

### Auto-creation
- When a new user signs up, a `profiles`, `preferences`, and `subscriptions` record is automatically created via a database trigger

### Indexes
- Performance indexes are created on frequently queried columns
- Example: `idx_messages_conversation_created` for fast message retrieval

## Verification

After running the migration, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
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

## Troubleshooting

### "Table already exists" error
This is normal - the script uses `CREATE TABLE IF NOT EXISTS` to safely re-run migrations.

### "Permission denied" error
Make sure you're logged in with an admin account that has permission to create tables and enable RLS.

### Missing NEXT_PUBLIC_SUPABASE_URL
Before running migrations, ensure your Supabase integration is properly configured in v0 with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Next Steps

After migrations are complete:
1. Your app should no longer show "table not found" errors
2. User signup via OTP will work
3. Document upload, conversations, and chat will be functional

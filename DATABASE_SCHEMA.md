# Zequel Database Schema Reference

Quick reference for all database tables and their fields.

## Tables

### 1. profiles
**Purpose:** User profile information (extends auth.users)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, references auth.users(id) |
| username | TEXT | Optional, unique |
| full_name | TEXT | User's display name |
| avatar_url | TEXT | URL to profile picture |
| created_at | TIMESTAMP | Auto-set on creation |
| updated_at | TIMESTAMP | Auto-updated |

**RLS:** Users can only access their own profile

---

### 2. otp_codes
**Purpose:** One-time passwords for signup, password reset

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| email | TEXT | Email address |
| code | TEXT | 6-digit OTP code |
| purpose | TEXT | 'signup', 'reset_password', 'change_password' |
| used | BOOLEAN | Whether code was used |
| expires_at | TIMESTAMP | Expiration time |
| created_at | TIMESTAMP | Creation time |

**Index:** (email, purpose) WHERE used = FALSE for fast lookups
**RLS:** No restrictions (needed for signup)

---

### 3. documents
**Purpose:** User uploaded files/documents

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Document owner |
| title | TEXT | Document name |
| file_name | TEXT | Original filename |
| file_path | TEXT | Path in storage |
| file_size | BIGINT | File size in bytes |
| extracted_text | TEXT | OCR'd/extracted text |
| page_count | INT | Number of pages |
| status | TEXT | 'processing', 'parsed', 'failed' |
| created_at | TIMESTAMP | Upload time |
| updated_at | TIMESTAMP | Last update |

**Storage:** Files stored in `documents` storage bucket
**Index:** (user_id, created_at DESC)
**RLS:** Users can only see their own documents

---

### 4. conversations
**Purpose:** Chat conversation sessions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Conversation owner |
| document_id | UUID | Linked document (optional) |
| title | TEXT | Conversation name |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last message time |

**Index:** (user_id, created_at DESC)
**RLS:** Users can only see their own conversations

---

### 5. messages
**Purpose:** Individual messages in conversations

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| conversation_id | UUID | Parent conversation |
| role | TEXT | 'user' or 'assistant' |
| content | TEXT | Message content |
| created_at | TIMESTAMP | Message time |
| updated_at | TIMESTAMP | Edit time |

**Index:** (conversation_id, created_at ASC) for chronological order
**RLS:** Users can only see messages in their conversations

---

### 6. queries
**Purpose:** Research/search queries on documents

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Query owner |
| document_id | UUID | Document being queried |
| query_text | TEXT | The search query |
| result | TEXT | Query result |
| status | TEXT | 'pending', 'completed', 'failed' |
| created_at | TIMESTAMP | Query time |
| updated_at | TIMESTAMP | Last update |

**Index:** (user_id, created_at DESC)
**RLS:** Users can only see their own queries

---

### 7. preferences
**Purpose:** User preferences and settings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | User (unique) |
| theme | TEXT | 'light', 'dark', 'auto' |
| notifications_enabled | BOOLEAN | Email notifications |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last change |

**RLS:** Users can only access their own preferences

---

### 8. subscriptions
**Purpose:** Subscription and billing information

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | User (unique) |
| plan | TEXT | 'free', 'pro', 'enterprise' |
| status | TEXT | 'active', 'cancelled', 'expired' |
| stripe_customer_id | TEXT | Stripe customer ID |
| stripe_subscription_id | TEXT | Stripe subscription ID |
| current_period_start | TIMESTAMP | Billing period start |
| current_period_end | TIMESTAMP | Billing period end |
| cancel_at | TIMESTAMP | Cancellation date |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last change |

**RLS:** Users can only see their own subscription

---

### 9. ai_usage_logs
**Purpose:** Track AI API usage and costs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | User who made request |
| model | TEXT | Model name (e.g., 'gpt-4', 'claude-opus') |
| endpoint | TEXT | API endpoint ('chat', 'query', etc) |
| input_tokens | INT | Input tokens consumed |
| output_tokens | INT | Output tokens generated |
| status | TEXT | 'success', 'error', 'rate_limited' |
| error_message | TEXT | Error details if failed |
| created_at | TIMESTAMP | Request time |

**Index:** (user_id, created_at DESC)
**RLS:** Users can only see their own logs

---

### 10. rate_limit_violations
**Purpose:** Track and enforce rate limits

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | User hitting limit |
| endpoint | TEXT | Which endpoint was limited |
| violation_count | INT | Number of violations |
| reset_at | TIMESTAMP | When limit resets |
| created_at | TIMESTAMP | First violation |
| updated_at | TIMESTAMP | Last violation |

**RLS:** Users can only see their own violations

---

### 11. system_settings
**Purpose:** Global system configuration

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| setting_key | TEXT | Setting name (unique) |
| setting_value | JSONB | Setting value (any type) |
| setting_type | TEXT | 'string', 'number', 'boolean', 'json' |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last change |

**RLS:** None (admin only)
**Examples:** API keys, feature flags, rate limits

---

### 12. admin_audit_logs
**Purpose:** Log all admin actions for compliance

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| admin_id | UUID | Admin who performed action |
| action | TEXT | Action type |
| resource_type | TEXT | What was modified |
| resource_id | TEXT | ID of resource |
| changes | JSONB | Before/after data |
| created_at | TIMESTAMP | Action time |

**RLS:** None (admin only)
**Index:** (admin_id, created_at DESC)

---

## Relationships

```
auth.users (Supabase auth)
├── profiles (1:1)
├── preferences (1:1)
├── subscriptions (1:1)
├── documents (1:many)
├── conversations (1:many)
│   └── messages (1:many)
├── queries (1:many)
├── ai_usage_logs (1:many)
├── rate_limit_violations (1:many)
└── admin_audit_logs (for admin users)

documents
└── conversations (documents can be linked to conversations)
```

## Storage Buckets

- **documents** - User uploaded files (PDFs, docs, etc.)
- **avatars** - User profile pictures

## Helpful Queries

### Get user's recent conversations
```sql
SELECT * FROM conversations 
WHERE user_id = 'user-id' 
ORDER BY updated_at DESC 
LIMIT 10;
```

### Get messages for a conversation
```sql
SELECT * FROM messages 
WHERE conversation_id = 'conv-id' 
ORDER BY created_at ASC;
```

### Get AI usage for current month
```sql
SELECT model, SUM(input_tokens) as total_input, SUM(output_tokens) as total_output
FROM ai_usage_logs 
WHERE user_id = 'user-id' 
  AND created_at >= date_trunc('month', now())
GROUP BY model;
```

### Check for active OTP codes
```sql
SELECT * FROM otp_codes 
WHERE email = 'user@example.com' 
  AND used = FALSE 
  AND expires_at > NOW()
  AND purpose = 'signup';
```

### Get user subscription details
```sql
SELECT u.email, s.plan, s.status, s.current_period_end
FROM profiles p
JOIN subscriptions s ON p.id = s.user_id
WHERE p.username = 'username';
```

---

## Notes

- All timestamps are in UTC (TIMESTAMP WITH TIME ZONE)
- UUIDs are used for all IDs for better security and scalability
- Row Level Security (RLS) ensures users can only access their own data
- Triggers automatically create related records when new users sign up
- Indexes are created on commonly-queried columns for performance

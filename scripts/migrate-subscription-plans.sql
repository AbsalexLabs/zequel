-- Migration script for new subscription plans
-- Run this on your existing Supabase database to update the schema

-- 1. Update system_settings table - add new columns for premium_lite and premium_pro
ALTER TABLE public.system_settings 
  ADD COLUMN IF NOT EXISTS premium_lite_daily_limit INTEGER DEFAULT 200;

ALTER TABLE public.system_settings 
  ADD COLUMN IF NOT EXISTS premium_pro_daily_limit INTEGER DEFAULT 1000;

ALTER TABLE public.system_settings 
  ADD COLUMN IF NOT EXISTS max_file_uploads_premium_lite INTEGER DEFAULT 30;

ALTER TABLE public.system_settings 
  ADD COLUMN IF NOT EXISTS max_file_uploads_premium_pro INTEGER DEFAULT 100;

-- 2. Update existing default values
UPDATE public.system_settings 
SET 
  free_daily_limit = 20,
  max_file_uploads_free = 3
WHERE id = 'default';

-- 3. Migrate existing premium users to premium_lite
UPDATE public.subscriptions 
SET plan = 'premium_lite', request_limit = 200
WHERE plan = 'premium';

-- 4. Migrate existing enterprise users to premium_pro
UPDATE public.subscriptions 
SET plan = 'premium_pro', request_limit = 1000
WHERE plan = 'enterprise';

-- 5. Update free users to new limit
UPDATE public.subscriptions 
SET request_limit = 20
WHERE plan = 'free';

-- 6. Optional: Remove old columns from system_settings (only run after confirming migration worked)
-- Uncomment these lines after verifying the migration:
-- ALTER TABLE public.system_settings DROP COLUMN IF EXISTS premium_daily_limit;
-- ALTER TABLE public.system_settings DROP COLUMN IF EXISTS max_file_uploads_premium;

-- Done! Your database is now updated for the new subscription tiers:
-- - Free: 20 requests/day, 3 documents, 10MB files
-- - Premium Lite ($2.99/mo): 200 requests/day, 30 documents, 50MB files
-- - Premium Pro ($5.99/mo): 1000 requests/day, 100 documents, 100MB files

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add extracted_text column to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add index on extracted_text for full-text search (optional but useful)
CREATE INDEX IF NOT EXISTS idx_documents_extracted_text ON public.documents USING GIN(to_tsvector('english', COALESCE(extracted_text, '')));

-- Update RLS policies if needed to allow users to update their own profiles
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verify profiles table structure
-- SELECT * FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- Quick fix to add suspended column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;

-- Verify the column was added
SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='suspended';

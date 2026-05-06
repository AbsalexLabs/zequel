-- Fix profiles table schema to match application code requirements
-- This migration adds missing columns to the profiles table

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Update any existing preferences table to ensure it has the required columns
ALTER TABLE public.preferences
  ADD COLUMN IF NOT EXISTS default_output_format TEXT DEFAULT 'summarize',
  ADD COLUMN IF NOT EXISTS auto_citation BOOLEAN DEFAULT true;

-- Add missing columns to documents table if needed
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on user_id for documents for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- Add index on conversation_id for messages for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Log completion
SELECT 'Profiles schema fixed successfully' as status;

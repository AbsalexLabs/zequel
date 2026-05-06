import { createClient } from '@supabase/supabase-js'

/**
 * Service client for server-side operations with service role key
 * Use this for operations that bypass RLS, like OTP management and admin functions
 * 
 * WARNING: This uses the service role key and bypasses RLS policies.
 * Only use for trusted server operations, never expose to clients.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('[v0] NEXT_PUBLIC_SUPABASE_URL is not configured')
  }

  if (!serviceRoleKey) {
    throw new Error('[v0] SUPABASE_SERVICE_ROLE_KEY is not configured - required for service operations')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

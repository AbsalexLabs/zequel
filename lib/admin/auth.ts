import { createClient } from '@/lib/supabase/server'

export type AdminRole = 'admin' | 'superadmin'

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
}

export async function verifyAdmin(): Promise<{ user: AdminUser | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { user: null, error: 'Unauthorized' }
  }

  // Get user's role from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { user: null, error: 'Profile not found' }
  }

  if (profile.role !== 'admin' && profile.role !== 'superadmin') {
    return { user: null, error: 'Access denied. Admin privileges required.' }
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
      role: profile.role as AdminRole,
    },
    error: null,
  }
}

export function adminResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function adminError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

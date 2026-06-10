import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { getUserIdentities } from '@/lib/admin/emails'

export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const plan = searchParams.get('plan')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const supabase = createServiceClient()

  // The `subscriptions.user_id` FK references `auth.users`, not
  // `public.profiles`, so PostgREST cannot embed a `profiles:user_id` join.
  // We select the raw rows and resolve identities (name + email) separately.
  let query = supabase
    .from('subscriptions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (plan) {
    query = query.eq('plan', plan)
  }

  const { data: subscriptions, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  // Resolve name + email from profiles/auth.users and expose them under a
  // `profiles` key so the client mapper keeps working unchanged.
  const identities = await getUserIdentities(
    supabase,
    subscriptions?.map((s) => s.user_id) || [],
  )

  const enriched = subscriptions?.map((s) => {
    const identity = identities.get(s.user_id)
    return {
      ...s,
      profiles: {
        full_name: identity?.full_name || null,
        email: identity?.email || '',
      },
    }
  })

  return adminResponse({
    subscriptions: enriched,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { getEmailsForUserIds, findUserIdsByEmail } from '@/lib/admin/emails'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const supabase = createServiceClient()

  // NOTE: emails live in `auth.users`, not in `public.profiles`, so we never
  // select or filter `profiles.email` directly. To support searching by email
  // (and id), we resolve matching auth user ids first, then OR them together
  // with a name match against profiles.
  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      role,
      suspended,
      created_at,
      updated_at
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    const term = search.trim()
    const orFilters: string[] = [`full_name.ilike.%${term}%`]

    // Exact id match when the search term looks like a UUID.
    if (UUID_RE.test(term)) {
      orFilters.push(`id.eq.${term}`)
    }

    // Resolve auth user ids whose email matches the term and include them.
    const emailMatchIds = await findUserIdsByEmail(supabase, term)
    if (emailMatchIds.length > 0) {
      orFilters.push(`id.in.(${emailMatchIds.join(',')})`)
    }

    query = query.or(orFilters.join(','))
  }

  const { data: users, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  // Get subscription info for each user
  const userIds = users?.map(u => u.id) || []

  // Resolve emails from auth.users for the page of profiles in view.
  const emailMap = await getEmailsForUserIds(supabase, userIds)
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('user_id, plan, expires_at')
    .in('user_id', userIds)

  const subscriptionMap = new Map(subscriptions?.map(s => [s.user_id, s]) || [])

  // Get usage stats for each user
  const { data: usageStats } = await supabase
    .from('ai_usage_logs')
    .select('user_id')
    .in('user_id', userIds)

  const usageCountMap = new Map<string, number>()
  usageStats?.forEach(u => {
    usageCountMap.set(u.user_id, (usageCountMap.get(u.user_id) || 0) + 1)
  })

  const enrichedUsers = users?.map(u => ({
    ...u,
    email: emailMap.get(u.id) || '',
    subscription: subscriptionMap.get(u.id) || { plan: 'free', expires_at: null },
    totalRequests: usageCountMap.get(u.id) || 0,
  }))

  return adminResponse({
    users: enrichedUsers,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

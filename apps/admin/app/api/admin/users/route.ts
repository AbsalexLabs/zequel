import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { getEmailsForUserIds } from '@/lib/admin/emails'

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
  // select or filter `profiles.email` directly. We resolve emails separately
  // via the service-role auth admin API below.
  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      suspended,
      created_at,
      updated_at
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('full_name', `%${search}%`)
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

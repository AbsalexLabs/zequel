import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { getEmailsForUserIds } from '@/lib/admin/emails'

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

  // `profiles` has no email column (emails live in auth.users), so we only
  // join the profile name here and resolve emails separately below.
  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      profiles:user_id (
        full_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (plan) {
    query = query.eq('plan', plan)
  }

  const { data: subscriptions, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  // Resolve emails from auth.users and merge them into each profile object so
  // the client mapper (which reads `row.profiles.email`) keeps working.
  const emailMap = await getEmailsForUserIds(
    supabase,
    subscriptions?.map((s) => s.user_id) || [],
  )

  const enriched = subscriptions?.map((s) => ({
    ...s,
    profiles: {
      ...(s.profiles || {}),
      email: emailMap.get(s.user_id) || '',
    },
  }))

  return adminResponse({
    subscriptions: enriched,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

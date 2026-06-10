import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { getUserIdentities, findUserIdsByEmail } from '@/lib/admin/emails'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const plan = searchParams.get('plan')
  const search = (searchParams.get('search') || '').trim()
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const supabase = createServiceClient()

  // Resolve the set of user ids that match the search term. Emails live in
  // auth.users and names in public.profiles, so we collect matching ids from
  // both (plus an exact id match when the term looks like a UUID) and then
  // filter the subscriptions query to that id set.
  let matchedUserIds: string[] | null = null
  if (search) {
    const ids = new Set<string>()

    // Exact id match when the search term looks like a UUID.
    if (UUID_RE.test(search)) {
      ids.add(search)
    }

    // Names from profiles.
    const { data: nameMatches } = await supabase
      .from('profiles')
      .select('id')
      .ilike('full_name', `%${search}%`)
    for (const p of nameMatches || []) ids.add(p.id)

    // Emails from auth.users.
    const emailMatchIds = await findUserIdsByEmail(supabase, search)
    for (const eid of emailMatchIds) ids.add(eid)

    matchedUserIds = Array.from(ids)

    // No matches at all — short-circuit with an empty result set.
    if (matchedUserIds.length === 0) {
      return adminResponse({ subscriptions: [], total: 0, page, limit, totalPages: 0 })
    }
  }

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

  if (matchedUserIds) {
    query = query.in('user_id', matchedUserIds)
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

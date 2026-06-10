import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { getUserIdentities } from '@/lib/admin/emails'

export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const endpoint = searchParams.get('endpoint')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  const supabase = createServiceClient()

  // The `ai_usage_logs.user_id` FK references `auth.users`, not
  // `public.profiles`, so we can't embed a `profiles:user_id` join. Select raw
  // rows and resolve identities separately.
  let query = supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (endpoint) {
    query = query.eq('endpoint', endpoint)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data: logs, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  // Calculate totals for current filter
  const totalTokens = logs?.reduce((sum, log) => 
    sum + (log.input_tokens || 0) + (log.output_tokens || 0), 0
  ) || 0

  // Resolve name + email from profiles/auth.users and expose them under a
  // `profiles` key so the client mapper keeps working unchanged.
  const identities = await getUserIdentities(
    supabase,
    logs?.map((l) => l.user_id) || [],
  )

  const enrichedLogs = logs?.map((l) => {
    const identity = identities.get(l.user_id)
    return {
      ...l,
      profiles: {
        full_name: identity?.full_name || null,
        email: identity?.email || '',
      },
    }
  })

  return adminResponse({
    logs: enrichedLogs,
    total: count || 0,
    totalTokens,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

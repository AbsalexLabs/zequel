import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'

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

  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      profiles:user_id (
        email,
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

  return adminResponse({
    subscriptions,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

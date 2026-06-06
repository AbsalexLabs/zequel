import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed']

// List bug reports submitted by users, newest first. Admin only.
export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const supabase = createServiceClient()

  let query = supabase
    .from('bug_reports')
    .select(
      `
      id,
      user_id,
      user_email,
      user_name,
      subject,
      description,
      status,
      page_url,
      user_agent,
      created_at,
      updated_at
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(
      `subject.ilike.%${search}%,user_email.ilike.%${search}%,user_name.ilike.%${search}%`
    )
  }

  const { data: reports, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  return adminResponse({
    reports: reports || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

// Update a bug report's status. Admin only.
export async function PATCH(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = typeof body?.status === 'string' ? body.status : ''

  if (!id) {
    return adminError('Missing report id', 400)
  }
  if (!VALID_STATUSES.includes(status)) {
    return adminError('Invalid status', 400)
  }

  const supabase = createServiceClient()
  const { error: updateError } = await supabase
    .from('bug_reports')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    return adminError(updateError.message, 500)
  }

  return adminResponse({ success: true })
}

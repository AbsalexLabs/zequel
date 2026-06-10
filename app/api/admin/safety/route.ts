import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { logAdminAction } from '@/lib/admin/audit'

const VALID_CATEGORIES = ['harmful', 'pii', 'jailbreak', 'spam', 'abuse']
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical']
const VALID_ACTIONS = ['flagged', 'blocked', 'reviewed', 'dismissed']

// List safety / moderation events, newest first. Admin only.
export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const severity = searchParams.get('severity') || ''
  const action = searchParams.get('action') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = (page - 1) * limit

  const supabase = createServiceClient()

  let query = supabase
    .from('safety_events')
    .select(
      `
      id,
      user_id,
      user_email,
      category,
      severity,
      action,
      detail,
      created_at
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category && VALID_CATEGORIES.includes(category)) {
    query = query.eq('category', category)
  }
  if (severity && VALID_SEVERITIES.includes(severity)) {
    query = query.eq('severity', severity)
  }
  if (action && VALID_ACTIONS.includes(action)) {
    query = query.eq('action', action)
  }
  if (search) {
    query = query.or(`user_email.ilike.%${search}%,detail.ilike.%${search}%`)
  }

  const { data: events, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  const enriched = (events || []).map((e) => ({
    id: e.id,
    user: e.user_email || (e.user_id ? e.user_id.slice(0, 8) : 'Unknown'),
    category: e.category,
    severity: e.severity,
    action: e.action,
    detail: e.detail || '',
    created_at: e.created_at,
  }))

  return adminResponse({
    events: enriched,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

// Update a safety event's action (reviewed / blocked / dismissed). Admin only.
export async function PATCH(request: Request) {
  const { user: admin, error } = await verifyAdmin()
  if (error || !admin) {
    return adminError(error || 'Unauthorized', 401)
  }

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const action = typeof body?.action === 'string' ? body.action : ''

  if (!id) {
    return adminError('Missing event id', 400)
  }
  if (!VALID_ACTIONS.includes(action)) {
    return adminError('Invalid action', 400)
  }

  const supabase = createServiceClient()
  const { error: updateError } = await supabase
    .from('safety_events')
    .update({ action })
    .eq('id', id)

  if (updateError) {
    return adminError(updateError.message, 500)
  }

  await logAdminAction({
    admin_id: admin.id,
    action: 'update_safety_event',
    target_type: 'system',
    target_id: id,
    details: { action },
  })

  return adminResponse({ success: true })
}

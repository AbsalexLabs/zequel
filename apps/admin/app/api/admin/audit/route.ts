import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { getEmailsForUserIds } from '@/lib/admin/emails'

export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  // Only superadmins can view full audit logs
  if (user.role !== 'superadmin') {
    return adminError('Superadmin access required', 403)
  }

  const { searchParams } = new URL(request.url)
  const adminId = searchParams.get('admin_id')
  const targetType = searchParams.get('target_type')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  const supabase = createServiceClient()

  // `profiles` has no email column (emails live in auth.users); join the admin
  // profile name only and resolve emails separately below.
  let query = supabase
    .from('admin_audit_logs')
    .select(`
      *,
      admin:admin_id (
        full_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (adminId) {
    query = query.eq('admin_id', adminId)
  }
  if (targetType) {
    query = query.eq('target_type', targetType)
  }

  const { data: logs, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  // Resolve emails from auth.users and merge into each admin object so the
  // client mapper (which reads `row.admin.email`) keeps working.
  const emailMap = await getEmailsForUserIds(
    supabase,
    logs?.map((l) => l.admin_id) || [],
  )

  const enrichedLogs = logs?.map((l) => ({
    ...l,
    admin: {
      ...(l.admin || {}),
      email: emailMap.get(l.admin_id) || '',
    },
  }))

  return adminResponse({
    logs: enrichedLogs,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

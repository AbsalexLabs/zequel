import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'

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

  let query = supabase
    .from('admin_audit_logs')
    .select(`
      *,
      admin:admin_id (
        email,
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

  return adminResponse({
    logs,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

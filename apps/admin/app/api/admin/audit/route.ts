import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { getUserIdentities } from '@/lib/admin/emails'

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

  // The `admin_audit_logs.admin_id` FK references `auth.users`, not
  // `public.profiles`, so PostgREST can't embed an `admin:admin_id` join.
  // Select raw rows and resolve identities separately.
  let query = supabase
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
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

  // Resolve admin name + email from profiles/auth.users and expose them under
  // an `admin` key so the client mapper keeps working unchanged.
  const identities = await getUserIdentities(
    supabase,
    logs?.map((l) => l.admin_id) || [],
  )

  const enrichedLogs = logs?.map((l) => {
    const identity = identities.get(l.admin_id)
    return {
      ...l,
      admin: {
        full_name: identity?.full_name || null,
        email: identity?.email || '',
      },
    }
  })

  return adminResponse({
    logs: enrichedLogs,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

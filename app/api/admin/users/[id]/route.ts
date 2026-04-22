import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { id } = await params
  const supabase = createServiceClient()

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (profileError || !profile) {
    return adminError('User not found', 404)
  }

  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', id)
    .single()

  // Get usage stats
  const { count: totalRequests } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from('ai_usage_logs')
    .select('endpoint, status, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get last activity
  const { data: lastActivity } = await supabase
    .from('ai_usage_logs')
    .select('created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return adminResponse({
    user: {
      ...profile,
      subscription: subscription || { plan: 'free', expires_at: null },
      totalRequests: totalRequests || 0,
      lastActivity: lastActivity?.created_at || null,
      recentActivity: recentActivity || [],
    },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, error } = await verifyAdmin()
  if (error || !admin) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { id } = await params
  const body = await request.json()
  const { action, ...data } = body

  const supabase = createServiceClient()

  switch (action) {
    case 'update_role': {
      if (admin.role !== 'superadmin' && data.role === 'superadmin') {
        return adminError('Only superadmins can create superadmins', 403)
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: data.role })
        .eq('id', id)

      if (updateError) {
        return adminError(updateError.message, 500)
      }

      await logAdminAction({
        admin_id: admin.id,
        action: 'update_role',
        target_type: 'user',
        target_id: id,
        details: { new_role: data.role },
      })

      return adminResponse({ success: true, message: 'Role updated' })
    }

    case 'update_subscription': {
      const { plan, expires_at } = data

      // Upsert subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: id,
          plan,
          expires_at,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (subError) {
        return adminError(subError.message, 500)
      }

      await logAdminAction({
        admin_id: admin.id,
        action: 'update_subscription',
        target_type: 'subscription',
        target_id: id,
        details: { plan, expires_at },
      })

      return adminResponse({ success: true, message: 'Subscription updated' })
    }

    case 'suspend': {
      const { error: suspendError } = await supabase
        .from('profiles')
        .update({ suspended: true, suspended_at: new Date().toISOString() })
        .eq('id', id)

      if (suspendError) {
        return adminError(suspendError.message, 500)
      }

      await logAdminAction({
        admin_id: admin.id,
        action: 'suspend_user',
        target_type: 'user',
        target_id: id,
      })

      return adminResponse({ success: true, message: 'User suspended' })
    }

    case 'unsuspend': {
      const { error: unsuspendError } = await supabase
        .from('profiles')
        .update({ suspended: false, suspended_at: null })
        .eq('id', id)

      if (unsuspendError) {
        return adminError(unsuspendError.message, 500)
      }

      await logAdminAction({
        admin_id: admin.id,
        action: 'unsuspend_user',
        target_type: 'user',
        target_id: id,
      })

      return adminResponse({ success: true, message: 'User unsuspended' })
    }

    default:
      return adminError('Invalid action', 400)
  }
}

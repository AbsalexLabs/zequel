import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { logAdminAction } from '@/lib/admin/audit'
import { getEmailForUserId } from '@/lib/admin/emails'
import { normalizePlan } from '@zequel/shared/security/subscription'

// Entitlements per plan. Kept in sync with apps/platform/app/api/subscription/route.ts
// so admin-driven plan changes grant the same limits a self-serve upgrade would.
const PLAN_LIMITS: Record<'free' | 'premium_lite' | 'premium_pro', { requestLimit: number }> = {
  free: { requestLimit: 20 },
  premium_lite: { requestLimit: 200 },
  premium_pro: { requestLimit: 1000 },
}

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

  // Get conversation + document counts so the admin profile shows real activity.
  const { count: conversationsCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)

  const { count: documentsCount } = await supabase
    .from('documents')
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

  // Resolve email from auth.users (profiles has no email column).
  const email = await getEmailForUserId(supabase, id)

  return adminResponse({
    user: {
      ...profile,
      email,
      subscription: subscription || { plan: 'free', expires_at: null },
      totalRequests: totalRequests || 0,
      conversationsCount: conversationsCount || 0,
      documentsCount: documentsCount || 0,
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
      // Normalize the requested plan so legacy / display values map to the
      // canonical tiers used everywhere else (free | premium_lite | premium_pro).
      const plan = normalizePlan(data.plan)
      const limits = PLAN_LIMITS[plan]

      // Paid plans get a fresh 30-day expiry; free clears it. Admins can still
      // pass an explicit expires_at to override (e.g. a comped plan).
      const expires_at =
        data.expires_at !== undefined
          ? data.expires_at
          : plan === 'free'
            ? null
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      // Write a COMPLETE subscription row. Previously only `plan` was set, which
      // left `status`/`request_limit` stale — the label changed but the user's
      // actual entitlements (and any prior "canceled" status) did not move.
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: id,
          plan,
          status: 'active',
          request_limit: limits.requestLimit,
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
        details: { plan, request_limit: limits.requestLimit, expires_at },
      })

      return adminResponse({ success: true, message: 'Subscription updated' })
    }

    case 'suspend': {
      const { error: suspendError } = await supabase
        .from('profiles')
        .update({ suspended: true })
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
        .update({ suspended: false })
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

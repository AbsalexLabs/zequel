import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const supabase = createServiceClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  // Get total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get active users today (users who made AI requests today)
  const { data: activeToday } = await supabase
    .from('ai_usage_logs')
    .select('user_id')
    .gte('created_at', todayStart)

  const uniqueActiveUsers = new Set(activeToday?.map(r => r.user_id) || []).size

  // Get total AI requests
  const { count: totalRequests } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })

  // Get requests today
  const { count: requestsToday } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart)

  // Get error count today
  const { count: errorsToday } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart)
    .eq('status', 'error')

  // Get subscription breakdown
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('plan')

  const planCounts = {
    free: 0,
    premium: 0,
    enterprise: 0,
  }
  
  subscriptions?.forEach(s => {
    if (s.plan in planCounts) {
      planCounts[s.plan as keyof typeof planCounts]++
    }
  })

  return adminResponse({
    totalUsers: totalUsers || 0,
    activeUsersToday: uniqueActiveUsers,
    totalRequests: totalRequests || 0,
    requestsToday: requestsToday || 0,
    errorsToday: errorsToday || 0,
    subscriptions: planCounts,
  })
}

import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'

// Returns the persisted subscription history (events) for a single user, newest
// first. The admin Subscriptions page loads this on demand when an admin opens
// the History dialog for a subscriber.
export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) {
    return adminError('Missing userId', 400)
  }

  const supabase = createServiceClient()

  const { data: events, error: queryError } = await supabase
    .from('subscription_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  return adminResponse({ events: events ?? [] })
}

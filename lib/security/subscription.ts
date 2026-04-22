import { createClient as createServerClient } from '@/lib/supabase/server'

export type SubscriptionPlan = 'free' | 'premium' | 'enterprise'

export interface Subscription {
  user_id: string
  plan: SubscriptionPlan
  request_limit: number
  expires_at: string | null
  is_active: boolean
}

// Default limits per plan
const PLAN_LIMITS: Record<SubscriptionPlan, { requestLimit: number }> = {
  free: { requestLimit: 50 },
  premium: { requestLimit: 500 },
  enterprise: { requestLimit: 5000 },
}

export async function getUserSubscription(userId: string): Promise<Subscription> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // No subscription found - return free tier
      return {
        user_id: userId,
        plan: 'free',
        request_limit: PLAN_LIMITS.free.requestLimit,
        expires_at: null,
        is_active: true,
      }
    }

    // Check if subscription is expired
    const isExpired = data.expires_at && new Date(data.expires_at) < new Date()
    
    if (isExpired) {
      return {
        user_id: userId,
        plan: 'free',
        request_limit: PLAN_LIMITS.free.requestLimit,
        expires_at: data.expires_at,
        is_active: false,
      }
    }

    return {
      user_id: data.user_id,
      plan: data.plan as SubscriptionPlan,
      request_limit: data.request_limit || PLAN_LIMITS[data.plan as SubscriptionPlan].requestLimit,
      expires_at: data.expires_at,
      is_active: true,
    }
  } catch {
    // On error, default to free tier
    return {
      user_id: userId,
      plan: 'free',
      request_limit: PLAN_LIMITS.free.requestLimit,
      expires_at: null,
      is_active: true,
    }
  }
}

export function isPremiumPlan(plan: SubscriptionPlan): boolean {
  return plan === 'premium' || plan === 'enterprise'
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, canCreateServiceClient } from '@/lib/supabase/service'

// Plan limits configuration
const PLAN_LIMITS = {
  free: { requestLimit: 20, fileUploads: 3, maxFileSize: 10 },
  premium_lite: { requestLimit: 200, fileUploads: 30, maxFileSize: 50 },
  premium_pro: { requestLimit: 1000, fileUploads: 100, maxFileSize: 100 },
}

// GET - Fetch current subscription
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine (default to free)
      console.error('Subscription fetch error:', subError)
    }

    // Default to free plan if no subscription exists
    const plan = subscription?.plan || 'free'
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

    return NextResponse.json({
      subscription: {
        plan,
        status: subscription?.status || 'active',
        request_limit: limits.requestLimit,
        file_uploads: limits.fileUploads,
        max_file_size: limits.maxFileSize,
        expires_at: subscription?.expires_at || null,
        created_at: subscription?.created_at || null,
      }
    })
  } catch (err) {
    console.error('Subscription API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update subscription (simplified - in production, integrate with Stripe)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body

    if (!plan || !['free', 'premium_lite', 'premium_pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // For premium/enterprise, in production you'd integrate with Stripe here
    // For now, we'll just update the subscription directly
    
    if (!canCreateServiceClient()) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const serviceClient = createServiceClient()
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]

    // Calculate expiry (1 month from now for paid plans)
    const expiresAt = plan !== 'free' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Upsert subscription
    const { data: subscription, error: upsertError } = await serviceClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan,
        status: 'active',
        request_limit: limits.requestLimit,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Subscription update error:', upsertError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    return NextResponse.json({
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        request_limit: limits.requestLimit,
        file_uploads: limits.fileUploads,
        max_file_size: limits.maxFileSize,
        expires_at: subscription.expires_at,
      },
      message: `Successfully ${plan === 'free' ? 'downgraded to' : 'upgraded to'} ${plan} plan`,
    })
  } catch (err) {
    console.error('Subscription update API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

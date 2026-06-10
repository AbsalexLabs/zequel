import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { logAdminAction } from '@/lib/admin/audit'

const VALID_PLANS = ['free', 'premium_lite', 'premium_pro']

// Fallback configs used if the plan_configs table is empty or unavailable.
const DEFAULT_PLAN_CONFIGS = [
  {
    plan: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      '20 AI requests per day',
      '3 document uploads',
      'Basic study mode',
      'Standard response speed',
      'Community support',
      'Limited workspace history',
    ],
    popular: false,
    sort_order: 0,
  },
  {
    plan: 'premium_lite',
    name: 'Premium Lite',
    price: 2.99,
    description: 'For regular researchers',
    features: [
      '200 AI requests per day',
      '30 document uploads',
      'Advanced study mode',
      'Research mode access',
      'Multi-document analysis',
      'Priority response speed',
      'Email support',
      'Extended file size (50MB)',
      'Citation export',
      'Full workspace history',
      'Advanced research tools',
    ],
    popular: true,
    sort_order: 1,
  },
  {
    plan: 'premium_pro',
    name: 'Premium Pro',
    price: 5.99,
    description: 'For power users',
    features: [
      '1,000 AI requests per day',
      '100 document uploads',
      'Advanced+ study mode',
      'Research mode access',
      'Multi-document analysis',
      'Highest priority speed',
      'Priority support',
      'Extended file size (100MB)',
      'Citation export',
      'Full workspace history',
      'Advanced research tools',
      'Early access features',
    ],
    popular: false,
    sort_order: 2,
  },
]

export async function GET() {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const supabase = createServiceClient()
  const { data, error: queryError } = await supabase
    .from('plan_configs')
    .select('*')
    .order('sort_order', { ascending: true })

  if (queryError || !data || data.length === 0) {
    return adminResponse({ plans: DEFAULT_PLAN_CONFIGS })
  }

  return adminResponse({ plans: data })
}

export async function PUT(request: Request) {
  const { user: admin, error } = await verifyAdmin()
  if (error || !admin) {
    return adminError(error || 'Unauthorized', 401)
  }

  const body = await request.json()
  const { plan, name, price, description, features, popular } = body

  if (!plan || !VALID_PLANS.includes(plan)) {
    return adminError('Invalid plan', 400)
  }
  if (typeof price !== 'number' || isNaN(price) || price < 0) {
    return adminError('Price must be a non-negative number', 400)
  }
  if (!Array.isArray(features) || features.some((f) => typeof f !== 'string')) {
    return adminError('Features must be a list of strings', 400)
  }

  const supabase = createServiceClient()
  const sortOrder = VALID_PLANS.indexOf(plan)

  const { error: upsertError } = await supabase
    .from('plan_configs')
    .upsert(
      {
        plan,
        name: String(name || plan),
        price,
        description: String(description || ''),
        features: features.map((f) => String(f).trim()).filter(Boolean),
        popular: Boolean(popular),
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      },
      { onConflict: 'plan' },
    )

  if (upsertError) {
    return adminError(upsertError.message, 500)
  }

  await logAdminAction({
    admin_id: admin.id,
    action: 'update_plan_config',
    target_type: 'plan',
    target_id: plan,
    details: { price, feature_count: features.length, popular: Boolean(popular) },
  })

  return adminResponse({ success: true, message: 'Plan updated' })
}

import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { logAdminAction } from '@/lib/admin/audit'

const VALID_STATUSES = ['active', 'archived', 'flagged']

// List conversations with message counts, token estimate, and owner info. Admin only.
export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  const supabase = createServiceClient()

  let query = supabase
    .from('conversations')
    .select(
      `
      id,
      user_id,
      title,
      status,
      document_id,
      created_at,
      updated_at,
      profiles:user_id ( email, full_name )
    `,
      { count: 'exact' }
    )
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data: conversations, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  // Aggregate message counts and a rough token estimate (~chars / 4) for the
  // returned conversations in a single query.
  const conversationIds = (conversations || []).map((c) => c.id)
  const messageCounts = new Map<string, number>()
  const tokenEstimates = new Map<string, number>()

  if (conversationIds.length > 0) {
    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id, content')
      .in('conversation_id', conversationIds)

    messages?.forEach((m) => {
      messageCounts.set(m.conversation_id, (messageCounts.get(m.conversation_id) || 0) + 1)
      const tokens = Math.ceil((m.content?.length || 0) / 4)
      tokenEstimates.set(m.conversation_id, (tokenEstimates.get(m.conversation_id) || 0) + tokens)
    })
  }

  const enriched = (conversations || []).map((c) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    return {
      id: c.id,
      title: c.title,
      user: profile?.full_name || profile?.email || 'Unknown',
      messages: messageCounts.get(c.id) || 0,
      documents: c.document_id ? 1 : 0,
      tokens: tokenEstimates.get(c.id) || 0,
      status: VALID_STATUSES.includes(c.status) ? c.status : 'active',
      updated_at: c.updated_at,
      created_at: c.created_at,
    }
  })

  return adminResponse({
    conversations: enriched,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

// Update a conversation's moderation status (active / archived / flagged). Admin only.
export async function PATCH(request: Request) {
  const { user: admin, error } = await verifyAdmin()
  if (error || !admin) {
    return adminError(error || 'Unauthorized', 401)
  }

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = typeof body?.status === 'string' ? body.status : ''

  if (!id) {
    return adminError('Missing conversation id', 400)
  }
  if (!VALID_STATUSES.includes(status)) {
    return adminError('Invalid status', 400)
  }

  const supabase = createServiceClient()
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    return adminError(updateError.message, 500)
  }

  await logAdminAction({
    admin_id: admin.id,
    action: 'update_conversation_status',
    target_type: 'system',
    target_id: id,
    details: { status },
  })

  return adminResponse({ success: true })
}

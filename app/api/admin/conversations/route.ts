import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'

// List conversations with message counts and owner info. Admin only.
export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
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
      document_id,
      created_at,
      updated_at,
      profiles:user_id ( email, full_name )
    `,
      { count: 'exact' }
    )
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data: conversations, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  // Aggregate message counts for the returned conversations in one query.
  const conversationIds = (conversations || []).map((c) => c.id)
  const messageCounts = new Map<string, number>()

  if (conversationIds.length > 0) {
    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)

    messages?.forEach((m) => {
      messageCounts.set(m.conversation_id, (messageCounts.get(m.conversation_id) || 0) + 1)
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

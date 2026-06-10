import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import { logAdminAction } from '@/lib/admin/audit'

// List uploaded documents with owner info. Admin only.
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
    .from('documents')
    .select(
      `
      id,
      user_id,
      title,
      file_name,
      file_size,
      file_type,
      page_count,
      status,
      created_at,
      updated_at,
      profiles:user_id ( email, full_name )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,file_name.ilike.%${search}%`)
  }

  const { data: documents, count, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  const enriched = (documents || []).map((d) => {
    const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
    return {
      id: d.id,
      title: d.title,
      file_name: d.file_name,
      file_type: d.file_type,
      file_size: d.file_size,
      page_count: d.page_count,
      status: d.status,
      owner: profile?.full_name || profile?.email || 'Unknown',
      created_at: d.created_at,
      updated_at: d.updated_at,
    }
  })

  return adminResponse({
    documents: enriched,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

// Delete a document. Admin only.
export async function DELETE(request: Request) {
  const { user: admin, error } = await verifyAdmin()
  if (error || !admin) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') || ''

  if (!id) {
    return adminError('Missing document id', 400)
  }

  const supabase = createServiceClient()
  const { error: deleteError } = await supabase.from('documents').delete().eq('id', id)

  if (deleteError) {
    return adminError(deleteError.message, 500)
  }

  await logAdminAction({
    admin_id: admin.id,
    action: 'delete_document',
    target_type: 'system',
    target_id: id,
  })

  return adminResponse({ success: true })
}

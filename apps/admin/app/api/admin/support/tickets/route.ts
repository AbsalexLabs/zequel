import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'

const VALID_STATUSES = ['open', 'waiting_for_user', 'resolved', 'closed']
const VALID_SOURCES = ['support_email', 'information_request', 'bug_report', 'contact_form']

// List support tickets for the admin Support Center. Supports search, status,
// source, assignment-category filters and sorting. Also returns the sidebar
// category/source counts and the roster of admins for assignment. Admin only.
export async function GET(request: Request) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').trim()
  const status = searchParams.get('status') || ''
  const source = searchParams.get('source') || ''
  const category = searchParams.get('category') || 'all'
  const sort = searchParams.get('sort') === 'updated' ? 'last_activity_at' : 'created_at'

  const supabase = createServiceClient()

  let query = supabase
    .from('support_tickets')
    .select(
      `
      id,
      ref,
      user_id,
      user_email,
      user_name,
      subject,
      preview,
      source,
      status,
      assigned_admin_id,
      created_at,
      updated_at,
      last_activity_at,
      assigned_admin:profiles!support_tickets_assigned_admin_id_fkey ( id, full_name )
    `,
    )
    .order(sort, { ascending: false })

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('status', status)
  }
  if (source && VALID_SOURCES.includes(source)) {
    query = query.eq('source', source)
  }

  // Category maps onto status / assignment filters.
  if (category === 'assigned_to_me') {
    query = query.eq('assigned_admin_id', user.id)
  } else if (category === 'unassigned') {
    query = query.is('assigned_admin_id', null)
  } else if (VALID_STATUSES.includes(category)) {
    query = query.eq('status', category)
  }

  if (search) {
    query = query.or(
      `subject.ilike.%${search}%,user_email.ilike.%${search}%,user_name.ilike.%${search}%,ref.ilike.%${search}%`,
    )
  }

  const { data: tickets, error: queryError } = await query

  if (queryError) {
    return adminError(queryError.message, 500)
  }

  // Sidebar counts (computed over the full, unfiltered ticket set).
  const { data: allRows, error: countError } = await supabase
    .from('support_tickets')
    .select('status, source, assigned_admin_id')

  if (countError) {
    return adminError(countError.message, 500)
  }

  const rows = allRows || []
  const counts = {
    all: rows.length,
    assigned_to_me: rows.filter((r) => r.assigned_admin_id === user.id).length,
    unassigned: rows.filter((r) => !r.assigned_admin_id).length,
    open: rows.filter((r) => r.status === 'open').length,
    waiting_for_user: rows.filter((r) => r.status === 'waiting_for_user').length,
    resolved: rows.filter((r) => r.status === 'resolved').length,
    closed: rows.filter((r) => r.status === 'closed').length,
    support_email: rows.filter((r) => r.source === 'support_email').length,
    information_request: rows.filter((r) => r.source === 'information_request').length,
    bug_report: rows.filter((r) => r.source === 'bug_report').length,
    contact_form: rows.filter((r) => r.source === 'contact_form').length,
  }

  // Admin roster for the assignment dropdown.
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['admin', 'superadmin'])
    .order('full_name', { ascending: true })

  return adminResponse({
    tickets: tickets || [],
    counts,
    admins: admins || [],
    currentAdminId: user.id,
  })
}

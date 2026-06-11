import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'
import {
  mapSummary,
  buildCategoryCounts,
  buildSourceCounts,
  mapAdmins,
  type TicketRow,
} from '@/lib/admin-dashboard/support-server'

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
  const categoryCounts = buildCategoryCounts(rows, user.id)
  const sourceCounts = buildSourceCounts(rows)

  // Admin roster for the assignment dropdown.
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['admin', 'superadmin'])
    .order('full_name', { ascending: true })

  const superAdmin = (admins || []).find((a) => a.role === 'superadmin')

  return adminResponse({
    tickets: ((tickets as TicketRow[] | null) || []).map(mapSummary),
    categoryCounts,
    sourceCounts,
    admins: mapAdmins(admins || []),
    currentAdminId: user.id,
    currentAdminName: user.name,
    superAdminId: superAdmin?.id || null,
  })
}

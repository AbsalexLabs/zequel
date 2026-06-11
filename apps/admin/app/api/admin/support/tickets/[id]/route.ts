import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@zequel/shared/supabase/service'

const VALID_STATUSES = ['open', 'waiting_for_user', 'resolved', 'closed']

const STATUS_EVENT: Record<string, string> = {
  open: 'Reopened',
  waiting_for_user: 'Updated',
  resolved: 'Resolved',
  closed: 'Closed',
}

// Full ticket detail: ticket row + assigned admin + user context (plan,
// account status) + the complete message timeline. Admin only.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { id } = await params
  const supabase = createServiceClient()

  const { data: ticket, error: ticketError } = await supabase
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
      bug_browser,
      bug_device,
      bug_os,
      bug_page_url,
      bug_screenshot,
      bug_description,
      created_at,
      updated_at,
      last_activity_at,
      assigned_admin:profiles!support_tickets_assigned_admin_id_fkey ( id, full_name )
    `,
    )
    .eq('id', id)
    .single()

  if (ticketError || !ticket) {
    return adminError(ticketError?.message || 'Ticket not found', 404)
  }

  // Resolve the requesting user's plan + account status for the context panel.
  let plan = 'free'
  let accountStatus = 'active'
  if (ticket.user_id) {
    const [{ data: sub }, { data: profile }] = await Promise.all([
      supabase.from('subscriptions').select('plan').eq('user_id', ticket.user_id).maybeSingle(),
      supabase.from('profiles').select('suspended').eq('id', ticket.user_id).maybeSingle(),
    ])
    plan = sub?.plan || 'free'
    accountStatus = profile?.suspended ? 'suspended' : 'active'
  }

  const { data: messages, error: messagesError } = await supabase
    .from('support_messages')
    .select(
      `
      id,
      kind,
      author,
      author_id,
      body,
      event,
      email_from,
      email_to,
      email_subject,
      attachments,
      created_at
    `,
    )
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  if (messagesError) {
    return adminError(messagesError.message, 500)
  }

  return adminResponse({
    ticket: { ...ticket, plan, account_status: accountStatus },
    messages: messages || [],
  })
}

// Update status and/or assignment. Logs a system event for each change so the
// timeline stays complete. Admin only.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) {
    return adminError('Invalid request body', 400)
  }

  const supabase = createServiceClient()
  const updates: Record<string, unknown> = {}
  const events: { event: string; body: string }[] = []

  // Status change.
  if (typeof body.status === 'string') {
    if (!VALID_STATUSES.includes(body.status)) {
      return adminError('Invalid status', 400)
    }
    updates.status = body.status
    const verb =
      body.status === 'resolved'
        ? 'marked resolved'
        : body.status === 'closed'
          ? 'closed'
          : body.status === 'open'
            ? 'reopened'
            : 'updated'
    events.push({ event: STATUS_EVENT[body.status] || 'Updated', body: `Ticket ${verb} by ${user.name}` })
  }

  // Assignment change. `assignedAdminId` of null clears the assignment.
  if ('assignedAdminId' in body) {
    const assignedId = body.assignedAdminId
    if (assignedId !== null && typeof assignedId !== 'string') {
      return adminError('Invalid assignment', 400)
    }
    updates.assigned_admin_id = assignedId

    if (assignedId) {
      const { data: admin } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', assignedId)
        .maybeSingle()
      const name = admin?.full_name || 'admin'
      const forwarded = body.forward === true
      events.push({
        event: forwarded ? 'Forwarded to Super Admin' : 'Assigned to Admin',
        body: forwarded ? `Forwarded to ${name} for review` : `Assigned to ${name}`,
      })
    } else {
      events.push({ event: 'Unassigned', body: `Ticket unassigned by ${user.name}` })
    }
  }

  if (Object.keys(updates).length === 0) {
    return adminError('Nothing to update', 400)
  }

  const { error: updateError } = await supabase.from('support_tickets').update(updates).eq('id', id)
  if (updateError) {
    return adminError(updateError.message, 500)
  }

  // Record system events for the timeline.
  if (events.length > 0) {
    await supabase.from('support_messages').insert(
      events.map((e) => ({
        ticket_id: id,
        kind: 'system',
        author: 'System',
        author_id: user.id,
        body: e.body,
        event: e.event,
      })),
    )
  }

  return adminResponse({ success: true })
}

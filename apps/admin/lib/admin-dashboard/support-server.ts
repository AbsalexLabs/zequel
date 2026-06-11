import type {
  AdminOption,
  Attachment,
  BugContext,
  CategoryCounts,
  SourceCounts,
  SubscriptionPlan,
  SupportTicketDetail,
  SupportTicketSummary,
  TimelineItem,
  TimelineKind,
} from '@/lib/admin-dashboard/support-center'

// ---------------------------------------------------------------------------
// Server-side mappers: convert raw Supabase rows (snake_case) into the
// camelCase shapes the Support Center UI consumes. Kept out of the client
// bundle so the SQL column names never leak into components.
// ---------------------------------------------------------------------------

interface AssignedAdminRel {
  id: string
  full_name: string | null
}

export interface TicketRow {
  id: string
  ref: string
  user_id: string | null
  user_email: string
  user_name: string | null
  subject: string
  preview: string | null
  source: string
  status: string
  assigned_admin_id: string | null
  created_at: string
  updated_at: string | null
  last_activity_at: string | null
  assigned_admin?: AssignedAdminRel | AssignedAdminRel[] | null
  // Detail-only bug fields.
  bug_browser?: string | null
  bug_device?: string | null
  bug_os?: string | null
  bug_page_url?: string | null
  bug_screenshot?: string | null
  bug_description?: string | null
  // Injected by the detail route.
  plan?: string | null
  account_status?: string | null
}

export interface MessageRow {
  id: string
  kind: string
  author: string | null
  author_id: string | null
  body: string
  event: string | null
  email_from: string | null
  email_to: string | null
  email_subject: string | null
  attachments: unknown
  created_at: string
}

function adminName(rel: TicketRow['assigned_admin']): string | null {
  if (!rel) return null
  const row = Array.isArray(rel) ? rel[0] : rel
  return row?.full_name || null
}

function normalizePlan(plan: string | null | undefined): SubscriptionPlan {
  if (plan === 'premium_lite' || plan === 'premium_pro') return plan
  if (plan === 'premium') return 'premium_lite'
  if (plan === 'enterprise') return 'premium_pro'
  return 'free'
}

export function mapSummary(row: TicketRow): SupportTicketSummary {
  return {
    id: row.id,
    ref: row.ref,
    subject: row.subject,
    userName: row.user_name || row.user_email,
    userEmail: row.user_email,
    source: row.source as SupportTicketSummary['source'],
    status: row.status as SupportTicketSummary['status'],
    assignedAdmin: adminName(row.assigned_admin) ?? (row.assigned_admin_id ? 'Assigned' : null),
    assignedAdminId: row.assigned_admin_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    lastActivityAt: row.last_activity_at || row.updated_at || row.created_at,
    preview: row.preview || '',
    unread: false,
  }
}

function mapAttachments(value: unknown): Attachment[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined
  return value
    .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
    .map((a, i) => ({
      id: String(a.id ?? i),
      name: String(a.name ?? 'attachment'),
      size: String(a.size ?? ''),
      kind: a.kind === 'image' ? 'image' : 'file',
    }))
}

export function mapMessage(row: MessageRow): TimelineItem {
  const item: TimelineItem = {
    id: row.id,
    kind: row.kind as TimelineKind,
    author: row.author || 'System',
    body: row.body,
    createdAt: row.created_at,
  }
  if (row.event) item.event = row.event
  const attachments = mapAttachments(row.attachments)
  if (attachments) item.attachments = attachments
  if (row.email_from || row.email_to || row.email_subject) {
    item.emailMeta = {
      from: row.email_from || '',
      to: row.email_to || '',
      subject: row.email_subject || '',
    }
  }
  return item
}

export function mapDetail(row: TicketRow, messages: MessageRow[]): SupportTicketDetail {
  const summary = mapSummary(row)
  const detail: SupportTicketDetail = {
    ...summary,
    userId: row.user_id || '',
    plan: normalizePlan(row.plan),
    accountStatus: (row.account_status as SupportTicketDetail['accountStatus']) || 'active',
    timeline: messages.map(mapMessage),
  }
  if (row.bug_description || row.bug_browser) {
    const bug: BugContext = {
      browser: row.bug_browser || 'Unknown',
      device: row.bug_device || 'Unknown',
      os: row.bug_os || 'Unknown',
      currentPage: row.bug_page_url || 'Unknown',
      description: row.bug_description || '',
    }
    if (row.bug_screenshot) bug.screenshot = row.bug_screenshot
    detail.bug = bug
  }
  return detail
}

interface CountRow {
  status: string
  source: string
  assigned_admin_id: string | null
}

export function buildCategoryCounts(rows: CountRow[], currentAdminId: string | null): CategoryCounts {
  return {
    all: rows.length,
    assigned_to_me: rows.filter((r) => r.assigned_admin_id === currentAdminId).length,
    unassigned: rows.filter((r) => !r.assigned_admin_id).length,
    open: rows.filter((r) => r.status === 'open').length,
    waiting_for_user: rows.filter((r) => r.status === 'waiting_for_user').length,
    resolved: rows.filter((r) => r.status === 'resolved').length,
    closed: rows.filter((r) => r.status === 'closed').length,
  }
}

export function buildSourceCounts(rows: CountRow[]): SourceCounts {
  return {
    support_email: rows.filter((r) => r.source === 'support_email').length,
    information_request: rows.filter((r) => r.source === 'information_request').length,
    bug_report: rows.filter((r) => r.source === 'bug_report').length,
    contact_form: rows.filter((r) => r.source === 'contact_form').length,
  }
}

export function mapAdmins(rows: { id: string; full_name: string | null }[]): AdminOption[] {
  return rows.map((r) => ({ id: r.id, name: r.full_name || 'Admin' }))
}

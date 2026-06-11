// ---------------------------------------------------------------------------
// Support Center — domain types + presentation helpers.
//
// All data is served live from /api/admin/support/* (Supabase-backed). This
// module holds the shared types, labels, and small derived helpers used by the
// Support Center UI. There is no mock data.
// ---------------------------------------------------------------------------

export type TicketSource =
  | "support_email"
  | "information_request"
  | "bug_report"
  | "contact_form"

export type TicketStatus = "open" | "waiting_for_user" | "resolved" | "closed"

export type SubscriptionPlan = "free" | "premium_lite" | "premium_pro"

export type AccountStatus = "active" | "suspended" | "invited"

// Timeline entries cover everything attached to a ticket.
export type TimelineKind = "user" | "admin" | "email" | "system" | "note"

export interface Attachment {
  id: string
  name: string
  size: string
  kind: "image" | "file"
}

export interface TimelineItem {
  id: string
  kind: TimelineKind
  author: string
  body: string
  createdAt: string
  attachments?: Attachment[]
  // For system events — a short machine label (e.g. "Ticket Created").
  event?: string
  // Email-specific metadata.
  emailMeta?: { from: string; to: string; subject: string }
}

export interface BugContext {
  browser: string
  device: string
  os: string
  currentPage: string
  screenshot?: string
  description: string
}

// Lightweight row used by the ticket list / middle panel.
export interface SupportTicketSummary {
  id: string
  ref: string
  subject: string
  userName: string
  userEmail: string
  source: TicketSource
  status: TicketStatus
  assignedAdmin: string | null
  assignedAdminId: string | null
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  preview: string
  unread: boolean
}

// Full ticket including conversation timeline + user context.
export interface SupportTicketDetail extends SupportTicketSummary {
  userId: string
  plan: SubscriptionPlan
  accountStatus: AccountStatus
  timeline: TimelineItem[]
  bug?: BugContext
}

// --- API response shapes ---------------------------------------------------

export interface CategoryCounts {
  all: number
  assigned_to_me: number
  unassigned: number
  open: number
  waiting_for_user: number
  resolved: number
  closed: number
}

export type SourceCounts = Record<TicketSource, number>

export interface AdminOption {
  id: string
  name: string
}

export interface SupportListResponse {
  tickets: SupportTicketSummary[]
  categoryCounts: CategoryCounts
  sourceCounts: SourceCounts
  admins: AdminOption[]
  currentAdminId: string | null
  currentAdminName: string | null
  superAdminId: string | null
}

// --- Labels ----------------------------------------------------------------

export const SOURCE_LABEL: Record<TicketSource, string> = {
  support_email: "Support Email",
  information_request: "Information Request",
  bug_report: "Bug Report",
  contact_form: "Website Contact",
}

export const SOURCE_ADDRESS: Partial<Record<TicketSource, string>> = {
  support_email: "support@zequel.xyz",
  information_request: "info@zequel.xyz",
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  waiting_for_user: "Waiting For User",
  resolved: "Resolved",
  closed: "Closed",
}

export const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  free: "Free",
  premium_lite: "Premium Lite",
  premium_pro: "Premium Pro",
}

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  invited: "Invited",
}

// Map ticket status -> StatusPill tone string already known to the design system.
export const STATUS_PILL: Record<TicketStatus, string> = {
  open: "open",
  waiting_for_user: "pending",
  resolved: "resolved",
  closed: "closed",
}

// --- Category model --------------------------------------------------------

export type CategoryId = keyof CategoryCounts

export interface CategoryDef {
  id: CategoryId
  label: string
}

export const CATEGORIES: CategoryDef[] = [
  { id: "all", label: "All Tickets" },
  { id: "assigned_to_me", label: "Assigned To Me" },
  { id: "unassigned", label: "Unassigned" },
  { id: "open", label: "Open" },
  { id: "waiting_for_user", label: "Waiting For User" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
]

export const SOURCES: { id: TicketSource; label: string }[] = [
  { id: "support_email", label: "Support Email" },
  { id: "information_request", label: "Information Requests" },
  { id: "bug_report", label: "Bug Reports" },
  { id: "contact_form", label: "Website Contact Forms" },
]

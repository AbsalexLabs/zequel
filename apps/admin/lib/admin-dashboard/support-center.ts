// ---------------------------------------------------------------------------
// Support Center — domain types + presentation mock data.
//
// Front-end only for now: these types model the full Support Center surface
// (tickets, conversation timeline, sources, assignment) so the UI can be built
// and reviewed before any backend/database wiring exists.
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

export interface SupportTicketDetail {
  id: string
  subject: string
  userId: string
  userName: string
  userEmail: string
  plan: SubscriptionPlan
  accountStatus: AccountStatus
  source: TicketSource
  status: TicketStatus
  assignedAdmin: string | null
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  preview: string
  unread: boolean
  timeline: TimelineItem[]
  bug?: BugContext
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

export const ADMINS = ["Maya Chen", "Devon Park", "Ari Cohen"] as const
export const CURRENT_ADMIN = "Maya Chen"
export const SUPER_ADMIN = "Devon Park"

// --- Category model --------------------------------------------------------

export type CategoryId =
  | "all"
  | "assigned_to_me"
  | "unassigned"
  | "open"
  | "waiting_for_user"
  | "resolved"
  | "closed"

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

// --- Mock data -------------------------------------------------------------

const now = Date.now()
const min = 60_000
const hr = 60 * min
const day = 24 * hr

const iso = (msAgo: number) => new Date(now - msAgo).toISOString()

export const MOCK_TICKETS: SupportTicketDetail[] = [
  {
    id: "ZQ-4821",
    subject: "Cannot export research report to PDF",
    userId: "usr_8f2a91",
    userName: "Jordan Reyes",
    userEmail: "jordan.reyes@gmail.com",
    plan: "premium_pro",
    accountStatus: "active",
    source: "support_email",
    status: "open",
    assignedAdmin: "Maya Chen",
    createdAt: iso(5 * hr),
    updatedAt: iso(22 * min),
    lastActivityAt: iso(22 * min),
    preview: "The export button spins forever and nothing downloads…",
    unread: true,
    timeline: [
      {
        id: "t1",
        kind: "system",
        author: "System",
        body: "Ticket created from support@zequel.xyz",
        event: "Ticket Created",
        createdAt: iso(5 * hr),
      },
      {
        id: "t2",
        kind: "user",
        author: "Jordan Reyes",
        body: "Hi team, when I click Export to PDF on my research report the button just spins forever and nothing downloads. I've tried Chrome and Safari. Can you help?",
        createdAt: iso(5 * hr),
      },
      {
        id: "t3",
        kind: "system",
        author: "System",
        body: "Assigned to Maya Chen",
        event: "Assigned to Admin",
        createdAt: iso(4 * hr),
      },
      {
        id: "t4",
        kind: "admin",
        author: "Maya Chen",
        body: "Hi Jordan — thanks for reporting this. Could you tell me roughly how many sources are in the report? Large reports can time out while rendering.",
        createdAt: iso(3 * hr),
      },
      {
        id: "t5",
        kind: "note",
        author: "Maya Chen",
        body: "Internal: reproduced on staging with 40+ source reports. Filing a bug with the rendering team.",
        createdAt: iso(2 * hr),
      },
      {
        id: "t6",
        kind: "user",
        author: "Jordan Reyes",
        body: "It's a big one — probably around 50 sources. Smaller reports export fine.",
        createdAt: iso(22 * min),
      },
    ],
  },
  {
    id: "ZQ-4820",
    subject: "Question about Premium Pro annual pricing",
    userId: "usr_1c77de",
    userName: "Amara Okafor",
    userEmail: "amara@brightlabs.io",
    plan: "premium_lite",
    accountStatus: "active",
    source: "information_request",
    status: "waiting_for_user",
    assignedAdmin: "Maya Chen",
    createdAt: iso(1 * day),
    updatedAt: iso(6 * hr),
    lastActivityAt: iso(6 * hr),
    preview: "Do you offer a discount for annual billing on Premium Pro?",
    unread: false,
    timeline: [
      {
        id: "t1",
        kind: "system",
        author: "System",
        body: "Ticket created from info@zequel.xyz",
        event: "Ticket Created",
        createdAt: iso(1 * day),
      },
      {
        id: "t2",
        kind: "user",
        author: "Amara Okafor",
        body: "Hello! Do you offer a discount for annual billing on the Premium Pro plan? Considering upgrading our team.",
        createdAt: iso(1 * day),
      },
      {
        id: "t3",
        kind: "admin",
        author: "Maya Chen",
        body: "Hi Amara — yes, annual billing saves 20% versus monthly. Would you like me to send over a team quote? How many seats are you considering?",
        createdAt: iso(6 * hr),
      },
    ],
  },
  {
    id: "ZQ-4819",
    subject: "App crashes when uploading a 90MB PDF",
    userId: "usr_44b0aa",
    userName: "Liam Schmidt",
    userEmail: "liam.schmidt@outlook.com",
    plan: "free",
    accountStatus: "active",
    source: "bug_report",
    status: "open",
    assignedAdmin: null,
    createdAt: iso(2 * hr),
    updatedAt: iso(2 * hr),
    lastActivityAt: iso(2 * hr),
    preview: "Uploading a large PDF freezes the whole workspace tab.",
    unread: true,
    timeline: [
      {
        id: "t1",
        kind: "system",
        author: "System",
        body: "Bug report submitted from the platform",
        event: "Ticket Created",
        createdAt: iso(2 * hr),
      },
      {
        id: "t2",
        kind: "user",
        author: "Liam Schmidt",
        body: "Uploading a large PDF (~90MB) freezes the whole workspace tab and I have to force-quit the browser.",
        createdAt: iso(2 * hr),
      },
    ],
    bug: {
      browser: "Chrome 124.0.6367",
      device: "MacBook Pro 14\"",
      os: "macOS 14.4 Sonoma",
      currentPage: "/workspace?mode=research",
      screenshot: "crash-screenshot.png",
      description: "Workspace tab becomes unresponsive after selecting a 90MB file in the upload dialog.",
    },
  },
  {
    id: "ZQ-4818",
    subject: "Partnership inquiry from university library",
    userId: "usr_9de201",
    userName: "Dr. Helen Vasquez",
    userEmail: "h.vasquez@stateuni.edu",
    plan: "free",
    accountStatus: "active",
    source: "contact_form",
    status: "open",
    assignedAdmin: null,
    createdAt: iso(8 * hr),
    updatedAt: iso(8 * hr),
    lastActivityAt: iso(8 * hr),
    preview: "We'd like to explore an institutional license for our students.",
    unread: false,
    timeline: [
      {
        id: "t1",
        kind: "system",
        author: "System",
        body: "Submitted from the website contact form",
        event: "Ticket Created",
        createdAt: iso(8 * hr),
      },
      {
        id: "t2",
        kind: "user",
        author: "Dr. Helen Vasquez",
        body: "Hello, I lead research services at our university library. We'd like to explore an institutional license for our graduate students. Who is the best person to talk to?",
        createdAt: iso(8 * hr),
      },
    ],
  },
  {
    id: "ZQ-4815",
    subject: "Billing — charged twice this month",
    userId: "usr_2aa7f3",
    userName: "Sofia Rossi",
    userEmail: "sofia.rossi@protonmail.com",
    plan: "premium_lite",
    accountStatus: "active",
    source: "support_email",
    status: "resolved",
    assignedAdmin: "Ari Cohen",
    createdAt: iso(3 * day),
    updatedAt: iso(1 * day),
    lastActivityAt: iso(1 * day),
    preview: "I see two charges for Premium Lite on my statement.",
    unread: false,
    timeline: [
      {
        id: "t1",
        kind: "system",
        author: "System",
        body: "Ticket created from support@zequel.xyz",
        event: "Ticket Created",
        createdAt: iso(3 * day),
      },
      {
        id: "t2",
        kind: "user",
        author: "Sofia Rossi",
        body: "I was charged twice for Premium Lite this month. Could you refund the duplicate?",
        createdAt: iso(3 * day),
      },
      {
        id: "t3",
        kind: "admin",
        author: "Ari Cohen",
        body: "Hi Sofia — confirmed the duplicate charge and issued a refund. It should appear within 5 business days. Apologies for the trouble!",
        createdAt: iso(2 * day),
      },
      {
        id: "t4",
        kind: "system",
        author: "System",
        body: "Marked as resolved by Ari Cohen",
        event: "Resolved",
        createdAt: iso(1 * day),
      },
    ],
  },
  {
    id: "ZQ-4810",
    subject: "Feature request: dark mode for shared reports",
    userId: "usr_77c0b1",
    userName: "Noah Williams",
    userEmail: "noah.w@gmail.com",
    plan: "premium_pro",
    accountStatus: "active",
    source: "contact_form",
    status: "closed",
    assignedAdmin: "Maya Chen",
    createdAt: iso(6 * day),
    updatedAt: iso(4 * day),
    lastActivityAt: iso(4 * day),
    preview: "Shared report links are always light themed — could we get dark mode?",
    unread: false,
    timeline: [
      {
        id: "t1",
        kind: "system",
        author: "System",
        body: "Submitted from the website contact form",
        event: "Ticket Created",
        createdAt: iso(6 * day),
      },
      {
        id: "t2",
        kind: "user",
        author: "Noah Williams",
        body: "Shared report links always render in light theme. Could we get a dark mode option for shared links?",
        createdAt: iso(6 * day),
      },
      {
        id: "t3",
        kind: "admin",
        author: "Maya Chen",
        body: "Great suggestion — I've logged this with the product team. Closing the ticket but it's on the roadmap.",
        createdAt: iso(5 * day),
      },
      {
        id: "t4",
        kind: "system",
        author: "System",
        body: "Closed by Maya Chen",
        event: "Closed",
        createdAt: iso(4 * day),
      },
    ],
  },
  {
    id: "ZQ-4808",
    subject: "Citations missing after research synthesis",
    userId: "usr_33fb9c",
    userName: "Priya Nair",
    userEmail: "priya.nair@research.org",
    plan: "premium_pro",
    accountStatus: "active",
    source: "bug_report",
    status: "waiting_for_user",
    assignedAdmin: "Devon Park",
    createdAt: iso(2 * day),
    updatedAt: iso(10 * hr),
    lastActivityAt: iso(10 * hr),
    preview: "Some inline citations disappear after running synthesis.",
    unread: false,
    timeline: [
      {
        id: "t1",
        kind: "system",
        author: "System",
        body: "Bug report submitted from the platform",
        event: "Ticket Created",
        createdAt: iso(2 * day),
      },
      {
        id: "t2",
        kind: "user",
        author: "Priya Nair",
        body: "After running synthesis on ~20 sources, a few inline citation markers disappear from the output even though the sources are still listed.",
        createdAt: iso(2 * day),
      },
      {
        id: "t3",
        kind: "admin",
        author: "Devon Park",
        body: "Thanks Priya. Could you share the report ID and confirm whether this happens every time or only on larger syntheses?",
        createdAt: iso(10 * hr),
      },
    ],
    bug: {
      browser: "Firefox 125.0",
      device: "Dell XPS 15",
      os: "Windows 11",
      currentPage: "/workspace?mode=research",
      description: "Inline citation markers occasionally dropped from synthesis output on large source sets.",
    },
  },
  {
    id: "ZQ-4802",
    subject: "How do I reset my password?",
    userId: "usr_5b1ad8",
    userName: "Marcus Bell",
    userEmail: "marcus.bell@gmail.com",
    plan: "free",
    accountStatus: "active",
    source: "information_request",
    status: "resolved",
    assignedAdmin: "Maya Chen",
    createdAt: iso(4 * day),
    updatedAt: iso(3 * day),
    lastActivityAt: iso(3 * day),
    preview: "I can't find the password reset option in settings.",
    unread: false,
    timeline: [
      {
        id: "t1",
        kind: "system",
        author: "System",
        body: "Ticket created from info@zequel.xyz",
        event: "Ticket Created",
        createdAt: iso(4 * day),
      },
      {
        id: "t2",
        kind: "user",
        author: "Marcus Bell",
        body: "I can't find where to reset my password. Can you point me in the right direction?",
        createdAt: iso(4 * day),
      },
      {
        id: "t3",
        kind: "admin",
        author: "Maya Chen",
        body: "Hi Marcus — head to the login page and click \"Forgot password\". You'll get a reset link by email. Let me know if it doesn't arrive!",
        createdAt: iso(3 * day),
      },
      {
        id: "t4",
        kind: "system",
        author: "System",
        body: "Marked as resolved by Maya Chen",
        event: "Resolved",
        createdAt: iso(3 * day),
      },
    ],
  },
]

// --- Derived helpers -------------------------------------------------------

export function matchesCategory(t: SupportTicketDetail, cat: CategoryId): boolean {
  switch (cat) {
    case "all":
      return true
    case "assigned_to_me":
      return t.assignedAdmin === CURRENT_ADMIN
    case "unassigned":
      return t.assignedAdmin === null
    case "open":
      return t.status === "open"
    case "waiting_for_user":
      return t.status === "waiting_for_user"
    case "resolved":
      return t.status === "resolved"
    case "closed":
      return t.status === "closed"
    default:
      return true
  }
}

export function categoryCount(tickets: SupportTicketDetail[], cat: CategoryId): number {
  return tickets.filter((t) => matchesCategory(t, cat)).length
}

export function sourceCount(tickets: SupportTicketDetail[], src: TicketSource): number {
  return tickets.filter((t) => t.source === src).length
}

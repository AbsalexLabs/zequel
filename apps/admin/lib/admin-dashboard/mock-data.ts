import type {
  AdminUser,
  AiUsageRecord,
  AuditLogEntry,
  Conversation,
  DocumentRecord,
  SafetyEvent,
  Subscription,
  SubscriptionEvent,
  SubscriptionTier,
  SupportTicket,
  TimeSeriesPoint,
} from "./types"

// ---------------------------------------------------------------------------
// Deterministic mock data for the Zequel Control Center front end.
// Everything here is presentation-only. To go live, replace the exported
// getters with fetches to /api/admin/* (the main app already exposes these).
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function hoursAgo(n: number): string {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

// Seeded pseudo-random so charts look organic but stable across renders.
function seriesFrom(seed: number, days: number, base: number, variance: number): TimeSeriesPoint[] {
  const out: TimeSeriesPoint[] = []
  let v = base
  for (let i = days - 1; i >= 0; i--) {
    const noise = (Math.sin(seed + i * 1.7) + Math.cos(seed * 0.5 + i)) * variance
    v = Math.max(0, Math.round(base + noise + (days - i) * (base * 0.012)))
    out.push({ date: daysAgo(i), value: v })
  }
  return out
}

export const overviewStats = {
  totalUsers: 18742,
  totalUsersDelta: 6.4,
  activeUsers: 7310,
  activeUsersDelta: 3.1,
  aiRequests: 1284503,
  aiRequestsDelta: 12.8,
  mrr: 84230,
  mrrDelta: 4.9,
  documentsIndexed: 92418,
  documentsDelta: 8.2,
  safetyFlags: 142,
  safetyFlagsDelta: -11.3,
  avgLatencyMs: 612,
  avgLatencyDelta: -4.4,
  errorRate: 0.42,
  errorRateDelta: -0.1,
}

export const requestVolumeSeries = seriesFrom(3, 30, 38000, 4200)
export const activeUserSeries = seriesFrom(7, 30, 6800, 540)
export const revenueSeries = seriesFrom(11, 30, 2600, 240)
export const latencySeries = seriesFrom(5, 30, 600, 90)

export const modelUsage = [
  { model: "zequel-synthesis-2", requests: 521340, share: 40.6 },
  { model: "zequel-reason-1.5", requests: 386201, share: 30.1 },
  { model: "zequel-vision-1", requests: 224870, share: 17.5 },
  { model: "zequel-embed-3", requests: 152092, share: 11.8 },
]

export const tierBreakdown = [
  { tier: "Free", users: 11240, fill: "var(--confidence-low)" },
  { tier: "Premium Lite", users: 5120, fill: "var(--confidence-medium)" },
  { tier: "Premium Pro", users: 2382, fill: "var(--primary)" },
]

export const activityFeed = [
  { id: "a1", actor: "Dr. Elena Royce", action: "promoted to Team plan", time: hoursAgo(1) },
  { id: "a2", actor: "Safety System", action: "blocked 3 jailbreak attempts", time: hoursAgo(2) },
  { id: "a3", actor: "Marcus Vaughn", action: "uploaded 14 documents", time: hoursAgo(3) },
  { id: "a4", actor: "Billing", action: "Enterprise renewal processed — $14,000", time: hoursAgo(5) },
  { id: "a5", actor: "Priya Nair", action: "opened a high-priority ticket", time: hoursAgo(8) },
  { id: "a6", actor: "System", action: "model zequel-synthesis-2 deployed", time: hoursAgo(11) },
  { id: "a7", actor: "Tomas Lind", action: "exceeded rate limit (throttled)", time: hoursAgo(14) },
]

const FIRST = ["Elena", "Marcus", "Priya", "Tomas", "Aiko", "Leon", "Sara", "Devon", "Mara", "Kojo", "Ines", "Rafael"]
const LAST = ["Royce", "Vaughn", "Nair", "Lind", "Tanaka", "Mercer", "Holt", "Quist", "Bellini", "Asante", "Vega", "Cruz"]
const TIERS = ["free", "premium_lite", "premium_pro"] as const
const STATUSES = ["active", "active", "active", "suspended", "invited"] as const

export const users: AdminUser[] = Array.from({ length: 48 }).map((_, i) => {
  const first = FIRST[i % FIRST.length]
  const last = LAST[(i * 3) % LAST.length]
  const tier = TIERS[(i * 5) % TIERS.length]
  const role = i === 0 ? "superadmin" : i < 4 ? "admin" : "user"
  return {
    id: `usr_${(1000 + i).toString(36)}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${tier === "premium_pro" ? "lab.org" : "mail.com"}`,
    role,
    tier,
    status: STATUSES[(i * 2) % STATUSES.length],
    createdAt: daysAgo(180 - i * 3),
    lastActiveAt: hoursAgo((i * 7) % 240),
    conversations: 12 + ((i * 37) % 320),
    documents: 3 + ((i * 13) % 180),
    aiRequests: 240 + ((i * 911) % 18000),
  }
})

// Pricing model used to compute MRR when granting / changing plans.
export const TIER_MRR: Record<SubscriptionTier, number> = { free: 0, premium_lite: 12, premium_pro: 29 }
export const TIER_SEATS: Record<SubscriptionTier, number> = { free: 1, premium_lite: 1, premium_pro: 1 }

export function computeMrr(tier: SubscriptionTier): number {
  return TIER_MRR[tier]
}

export const subscriptions: Subscription[] = users
  .filter((u) => u.tier !== "free")
  .map((u, i) => {
    const statuses = ["active", "active", "active", "trialing", "past_due", "canceled"] as const
    return {
      id: `sub_${(2000 + i).toString(36)}`,
      userId: u.id,
      user: u.name,
      email: u.email,
      tier: u.tier,
      status: statuses[(i * 3) % statuses.length],
      mrr: TIER_MRR[u.tier],
      seats: TIER_SEATS[u.tier],
      renewsAt: daysAgo(-(5 + (i % 25))),
      startedAt: daysAgo(120 - i * 2),
    }
  })

// Per-subscription event history. New admin actions get prepended at runtime.
const HISTORY_TIERS: SubscriptionTier[] = ["free", "premium_lite", "premium_pro"]

export const subscriptionEvents: SubscriptionEvent[] = subscriptions.flatMap((sub, i) => {
  const events: SubscriptionEvent[] = [
    {
      id: `subevt_${sub.id}_grant`,
      subscriptionId: sub.id,
      type: "granted",
      toTier: sub.tier,
      actor: "Billing System",
      note: "Initial plan activated",
      createdAt: sub.startedAt,
    },
  ]
  if (i % 2 === 0) {
    const from = HISTORY_TIERS[i % HISTORY_TIERS.length]
    if (from !== sub.tier) {
      events.push({
        id: `subevt_${sub.id}_change`,
        subscriptionId: sub.id,
        type: "tier_changed",
        fromTier: from,
        toTier: sub.tier,
        actor: "Dr. Elena Royce",
        note: "Upgraded after sales review",
        createdAt: daysAgo(60 - (i % 30)),
      })
    }
  }
  if (sub.status === "past_due") {
    events.push({
      id: `subevt_${sub.id}_fail`,
      subscriptionId: sub.id,
      type: "payment_failed",
      actor: "Billing System",
      note: "Card declined on renewal attempt",
      createdAt: daysAgo(3 + (i % 5)),
    })
  }
  if (sub.status === "canceled") {
    events.push({
      id: `subevt_${sub.id}_revoke`,
      subscriptionId: sub.id,
      type: "revoked",
      fromTier: sub.tier,
      actor: "Marcus Vaughn",
      note: "Revoked at customer request",
      createdAt: daysAgo(2 + (i % 6)),
    })
  } else if (sub.status === "active" && i % 3 === 0) {
    events.push({
      id: `subevt_${sub.id}_renew`,
      subscriptionId: sub.id,
      type: "renewed",
      actor: "Billing System",
      createdAt: daysAgo(8 + (i % 20)),
    })
  }
  return events
})

const MODELS = ["zequel-synthesis-2", "zequel-reason-1.5", "zequel-vision-1", "zequel-embed-3"]
const REQ_TYPES = ["completion", "synthesis", "vision", "embedding"] as const

export const aiUsage: AiUsageRecord[] = Array.from({ length: 60 }).map((_, i) => {
  const status = i % 17 === 0 ? "error" : i % 23 === 0 ? "throttled" : "success"
  return {
    id: `req_${(3000 + i).toString(36)}`,
    user: users[(i * 7) % users.length].name,
    model: MODELS[i % MODELS.length],
    type: REQ_TYPES[i % REQ_TYPES.length],
    tokens: 800 + ((i * 1313) % 24000),
    latencyMs: 180 + ((i * 97) % 2200),
    cost: Number((0.002 * (1 + ((i * 13) % 40))).toFixed(4)),
    status,
    createdAt: hoursAgo(i),
  }
})

const CONV_TITLES = [
  "Protein folding pathway synthesis",
  "Comparative climate model review",
  "Quarterly financial risk analysis",
  "CRISPR off-target literature scan",
  "Macroeconomic policy brief",
  "Neural scaling laws meta-review",
  "Supply chain resilience study",
  "Quantum error correction notes",
  "Epidemiology cohort comparison",
  "Renewable grid capacity model",
]

export const conversations: Conversation[] = Array.from({ length: 40 }).map((_, i) => {
  const status = i % 13 === 0 ? "flagged" : i % 4 === 0 ? "archived" : "active"
  return {
    id: `cnv_${(4000 + i).toString(36)}`,
    title: CONV_TITLES[i % CONV_TITLES.length],
    user: users[(i * 5) % users.length].name,
    messages: 6 + ((i * 11) % 90),
    documents: i % 9,
    tokens: 3200 + ((i * 1701) % 60000),
    updatedAt: hoursAgo(i * 2),
    status,
  }
})

const DOC_TYPES = ["pdf", "docx", "txt", "md", "web"] as const
const DOC_NAMES = [
  "Nature_2024_review.pdf",
  "Q3_market_report.docx",
  "experiment_notes.md",
  "policy_draft_v4.pdf",
  "dataset_readme.txt",
  "arxiv_2405.11234.pdf",
  "clinical_trial_summary.pdf",
  "interview_transcript.txt",
]

export const documents: DocumentRecord[] = Array.from({ length: 44 }).map((_, i) => {
  const status = i % 15 === 0 ? "failed" : i % 7 === 0 ? "processing" : "indexed"
  return {
    id: `doc_${(5000 + i).toString(36)}`,
    name: DOC_NAMES[i % DOC_NAMES.length],
    type: DOC_TYPES[i % DOC_TYPES.length],
    owner: users[(i * 3) % users.length].name,
    sizeMb: Number((0.4 + ((i * 7) % 80) / 10).toFixed(1)),
    pages: 1 + ((i * 17) % 320),
    status,
    uploadedAt: daysAgo(i),
  }
})

const SAFETY_CATS = ["harmful", "pii", "jailbreak", "spam", "abuse"] as const
const SAFETY_SEV = ["low", "medium", "high", "critical"] as const
const SAFETY_ACTIONS = ["flagged", "blocked", "reviewed", "dismissed"] as const

export const safetyEvents: SafetyEvent[] = Array.from({ length: 32 }).map((_, i) => ({
  id: `saf_${(6000 + i).toString(36)}`,
  user: users[(i * 11) % users.length].name,
  category: SAFETY_CATS[i % SAFETY_CATS.length],
  severity: SAFETY_SEV[(i * 3) % SAFETY_SEV.length],
  action: SAFETY_ACTIONS[i % SAFETY_ACTIONS.length],
  detail: [
    "Prompt attempted to extract system instructions",
    "Email address detected in uploaded document",
    "Repeated requests for disallowed content",
    "Bulk automated requests from single IP",
    "Harassment language flagged in conversation",
  ][i % 5],
  createdAt: hoursAgo(i * 3),
}))

const AUDIT_ACTIONS = [
  "updated rate limit",
  "suspended user account",
  "changed subscription tier",
  "exported user data",
  "modified system setting",
  "deleted conversation",
  "granted admin role",
  "rotated API key",
]

export const auditLog: AuditLogEntry[] = Array.from({ length: 36 }).map((_, i) => ({
  id: `aud_${(7000 + i).toString(36)}`,
  actor: i % 4 === 0 ? "Dr. Elena Royce" : users[(i * 2) % 4].name,
  actorRole: i % 4 === 0 ? "superadmin" : "admin",
  action: AUDIT_ACTIONS[i % AUDIT_ACTIONS.length],
  target: users[(i * 6) % users.length].email,
  ip: `192.0.2.${(i * 7) % 255}`,
  createdAt: hoursAgo(i * 2),
}))

const TICKET_SUBJECTS = [
  "Document upload stuck at processing",
  "Billing charged twice this month",
  "Request access to enterprise SSO",
  "Synthesis output cut off mid-response",
  "Cannot reset my password",
  "Feature request: citation export",
  "Conversation history missing",
  "Rate limited unexpectedly",
]
const TICKET_PRIORITY = ["low", "normal", "high", "urgent"] as const
const TICKET_STATUS = ["open", "pending", "resolved", "closed"] as const
const TICKET_CAT = ["bug", "billing", "feature", "account", "other"] as const

export const supportTickets: SupportTicket[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `tkt_${(8000 + i).toString(36)}`,
  subject: TICKET_SUBJECTS[i % TICKET_SUBJECTS.length],
  user: users[(i * 9) % users.length].name,
  email: users[(i * 9) % users.length].email,
  priority: TICKET_PRIORITY[(i * 3) % TICKET_PRIORITY.length],
  status: TICKET_STATUS[i % TICKET_STATUS.length],
  category: TICKET_CAT[i % TICKET_CAT.length],
  createdAt: hoursAgo(i * 4),
  updatedAt: hoursAgo(i),
}))

// Shared types for the Zequel Control Center (admin dashboard).
// Kept self-contained so the entire admin-dashboard surface can be lifted
// into a standalone deployment with minimal changes.

export type AdminRole = "admin" | "superadmin"

// Real Zequel plans (matches the `subscriptions.plan` column in the database).
export type SubscriptionTier = "free" | "premium_lite" | "premium_pro"

// Human-readable labels and monthly prices for each plan.
export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  premium_lite: "Premium Lite",
  premium_pro: "Premium Pro",
}

export const TIER_PRICES: Record<SubscriptionTier, number> = {
  free: 0,
  premium_lite: 12,
  premium_pro: 29,
}

// Daily AI request allowance per plan (matches system_settings defaults).
export const TIER_REQUEST_LIMITS: Record<SubscriptionTier, number> = {
  free: 20,
  premium_lite: 200,
  premium_pro: 1000,
}

export type UserStatus = "active" | "suspended" | "invited"

export interface AdminUser {
  id: string
  name: string
  email: string
  role: "user" | "admin" | "superadmin"
  tier: SubscriptionTier
  status: UserStatus
  createdAt: string
  lastActiveAt: string
  conversations: number
  documents: number
  aiRequests: number
}

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing"

// Editable per-plan configuration (price + feature list) managed from the
// admin Subscriptions page. Drives the platform subscription page and will be
// the source of truth for payments once a provider is integrated.
export interface PlanConfig {
  plan: SubscriptionTier
  name: string
  price: number
  description: string
  features: string[]
  popular: boolean
  sort_order: number
}

export interface Subscription {
  id: string
  userId: string
  user: string
  email: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  renewsAt: string
  startedAt: string
}

export type SubscriptionEventType =
  | "granted"
  | "tier_changed"
  | "renewed"
  | "payment_failed"
  | "revoked"
  | "reactivated"

export interface SubscriptionEvent {
  id: string
  subscriptionId: string
  type: SubscriptionEventType
  fromTier?: SubscriptionTier
  toTier?: SubscriptionTier
  actor: string
  note?: string
  createdAt: string
}

export interface AiUsageRecord {
  id: string
  user: string
  model: string
  type: "completion" | "embedding" | "vision" | "synthesis"
  tokens: number
  latencyMs: number
  cost: number
  status: "success" | "error" | "throttled"
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  user: string
  messages: number
  documents: number
  tokens: number
  updatedAt: string
  status: "active" | "archived" | "flagged"
}

export interface DocumentRecord {
  id: string
  name: string
  type: "pdf" | "docx" | "txt" | "md" | "web"
  owner: string
  sizeMb: number
  pages: number
  status: "indexed" | "processing" | "failed"
  uploadedAt: string
}

export interface SafetyEvent {
  id: string
  user: string
  category: "harmful" | "pii" | "jailbreak" | "spam" | "abuse"
  severity: "low" | "medium" | "high" | "critical"
  action: "flagged" | "blocked" | "reviewed" | "dismissed"
  detail: string
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  actor: string
  actorRole: AdminRole
  action: string
  target: string
  ip: string
  createdAt: string
}

export interface SupportTicket {
  id: string
  subject: string
  user: string
  email: string
  priority: "low" | "normal" | "high" | "urgent"
  status: "open" | "pending" | "resolved" | "closed"
  category: "bug" | "billing" | "feature" | "account" | "other"
  createdAt: string
  updatedAt: string
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

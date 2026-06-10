"use client"

import useSWR, { type SWRConfiguration } from "swr"
import type {
  AdminUser,
  AiUsageRecord,
  AuditLogEntry,
  Conversation,
  DocumentRecord,
  SafetyEvent,
  Subscription,
  SubscriptionTier,
  SupportTicket,
} from "./types"

// ---------------------------------------------------------------------------
// Shared fetcher + helpers for the Zequel Control Center.
// All admin pages read live data through these hooks (backed by /api/admin/*).
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status)
  }
  return body as T
}

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
}

// --- Mappers ---------------------------------------------------------------

const KNOWN_TIERS: SubscriptionTier[] = ["free", "premium_lite", "premium_pro"]

export function normalizeTier(plan: string | null | undefined): SubscriptionTier {
  if (plan && (KNOWN_TIERS as string[]).includes(plan)) return plan as SubscriptionTier
  // Map legacy values defensively.
  if (plan === "premium") return "premium_lite"
  if (plan === "enterprise") return "premium_pro"
  return "free"
}

interface ApiProfileRow {
  id: string
  email: string | null
  full_name: string | null
  avatar_url?: string | null
  role: string | null
  suspended?: boolean | null
  created_at: string
  updated_at?: string | null
  subscription?: { plan?: string | null; expires_at?: string | null } | null
  totalRequests?: number
  conversationsCount?: number
  documentsCount?: number
}

export function mapUser(row: ApiProfileRow): AdminUser {
  const role = (row.role === "admin" || row.role === "superadmin" ? row.role : "user") as AdminUser["role"]
  return {
    id: row.id,
    name: row.full_name || row.email?.split("@")[0] || "Unknown",
    email: row.email || "",
    avatarUrl: row.avatar_url || null,
    role,
    tier: normalizeTier(row.subscription?.plan),
    status: row.suspended ? "suspended" : "active",
    createdAt: row.created_at,
    lastActiveAt: row.updated_at || row.created_at,
    conversations: row.conversationsCount || 0,
    documents: row.documentsCount || 0,
    aiRequests: row.totalRequests || 0,
  }
}

interface ApiSubscriptionRow {
  id: string
  user_id: string
  plan: string | null
  status: string | null
  request_limit?: number | null
  expires_at: string | null
  created_at: string
  updated_at?: string | null
  profiles?: { email?: string | null; full_name?: string | null } | null
}

export function mapSubscription(row: ApiSubscriptionRow): Subscription {
  const tier = normalizeTier(row.plan)
  const status = (["active", "past_due", "canceled", "trialing"].includes(row.status || "")
    ? row.status
    : "active") as Subscription["status"]
  return {
    id: row.id,
    userId: row.user_id,
    user: row.profiles?.full_name || row.profiles?.email?.split("@")[0] || "Unknown",
    email: row.profiles?.email || "",
    tier,
    status,
    renewsAt: row.expires_at || row.created_at,
    startedAt: row.created_at,
  }
}

interface ApiUsageRow {
  id: string
  user_id: string
  endpoint: string
  model: string
  input_tokens: number | null
  output_tokens: number | null
  status: string | null
  created_at: string
  profiles?: { email?: string | null; full_name?: string | null } | null
}

function mapUsageType(endpoint: string): AiUsageRecord["type"] {
  if (endpoint.includes("embed")) return "embedding"
  if (endpoint.includes("vision") || endpoint.includes("image")) return "vision"
  if (endpoint.includes("synth") || endpoint.includes("research")) return "synthesis"
  return "completion"
}

export function mapUsage(row: ApiUsageRow): AiUsageRecord {
  const tokens = (row.input_tokens || 0) + (row.output_tokens || 0)
  const status = (["success", "error", "throttled"].includes(row.status || "")
    ? row.status
    : "success") as AiUsageRecord["status"]
  return {
    id: row.id,
    user: row.profiles?.full_name || row.profiles?.email || row.user_id.slice(0, 8),
    model: row.model,
    type: mapUsageType(row.endpoint),
    tokens,
    // Cost estimate: ~$0.000002 per token (presentation-only derived metric).
    latencyMs: 0,
    cost: Number((tokens * 0.000002).toFixed(4)),
    status,
    createdAt: row.created_at,
  }
}

interface ApiAuditRow {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  admin?: { email?: string | null; full_name?: string | null } | null
}

export function mapAudit(row: ApiAuditRow): AuditLogEntry {
  return {
    id: row.id,
    actor: row.admin?.full_name || row.admin?.email || row.admin_id.slice(0, 8),
    actorRole: "admin",
    action: row.action.replace(/_/g, " "),
    target: row.target_id ? `${row.target_type}:${row.target_id}` : row.target_type,
    ip: "—",
    createdAt: row.created_at,
  }
}

interface ApiBugReport {
  id: string
  user_email: string
  user_name: string | null
  subject: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

const BUG_STATUS_TO_TICKET: Record<string, SupportTicket["status"]> = {
  open: "open",
  in_progress: "pending",
  resolved: "resolved",
  closed: "closed",
}

export function mapBugReport(row: ApiBugReport): SupportTicket {
  return {
    id: row.id,
    subject: row.subject,
    user: row.user_name || row.user_email.split("@")[0],
    email: row.user_email,
    priority: "normal",
    status: BUG_STATUS_TO_TICKET[row.status] || "open",
    category: "bug",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

interface ApiConversationRow {
  id: string
  title: string
  user: string
  messages: number
  documents: number
  tokens: number
  status: string
  created_at: string
  updated_at: string
}

export function mapConversation(row: ApiConversationRow): Conversation {
  const status = (["active", "archived", "flagged"].includes(row.status)
    ? row.status
    : "active") as Conversation["status"]
  return {
    id: row.id,
    title: row.title || "Untitled conversation",
    user: row.user,
    messages: row.messages,
    documents: row.documents,
    tokens: row.tokens,
    status,
    updatedAt: row.updated_at,
  }
}

interface ApiDocumentRow {
  id: string
  title: string
  file_name: string
  file_type: string | null
  file_size: number | null
  page_count: number | null
  status: string
  owner: string
  created_at: string
  updated_at: string
}

function mapDocType(fileType: string | null, fileName: string): DocumentRecord["type"] {
  const ext = (fileName.split(".").pop() || "").toLowerCase()
  const candidate = (fileType || ext || "").toLowerCase()
  if (candidate.includes("pdf")) return "pdf"
  if (candidate.includes("doc")) return "docx"
  if (candidate.includes("md") || candidate.includes("markdown")) return "md"
  if (candidate.includes("txt") || candidate.includes("text") || candidate.includes("plain")) return "txt"
  if (candidate.includes("html") || candidate.includes("web")) return "web"
  return "txt"
}

function mapDocStatus(status: string): DocumentRecord["status"] {
  // DB uses processing | parsed | failed. The UI treats a successfully parsed
  // document as "indexed".
  if (status === "parsed" || status === "indexed" || status === "ready" || status === "completed")
    return "indexed"
  if (status === "failed" || status === "error") return "failed"
  return "processing"
}

export function mapDocument(row: ApiDocumentRow): DocumentRecord {
  return {
    id: row.id,
    name: row.title || row.file_name,
    type: mapDocType(row.file_type, row.file_name),
    owner: row.owner,
    sizeMb: row.file_size ? Number((row.file_size / (1024 * 1024)).toFixed(2)) : 0,
    pages: row.page_count || 0,
    status: mapDocStatus(row.status),
    uploadedAt: row.created_at,
  }
}

interface ApiSafetyRow {
  id: string
  user: string
  category: string
  severity: string
  action: string
  detail: string
  created_at: string
}

export function mapSafetyEvent(row: ApiSafetyRow): SafetyEvent {
  const category = (["harmful", "pii", "jailbreak", "spam", "abuse"].includes(row.category)
    ? row.category
    : "abuse") as SafetyEvent["category"]
  const severity = (["low", "medium", "high", "critical"].includes(row.severity)
    ? row.severity
    : "low") as SafetyEvent["severity"]
  const action = (["flagged", "blocked", "reviewed", "dismissed"].includes(row.action)
    ? row.action
    : "flagged") as SafetyEvent["action"]
  return {
    id: row.id,
    user: row.user,
    category,
    severity,
    action,
    detail: row.detail,
    createdAt: row.created_at,
  }
}

// --- Response shapes -------------------------------------------------------

export interface StatsResponse {
  totalUsers: number
  activeUsersToday: number
  totalRequests: number
  requestsToday: number
  errorsToday: number
  subscriptions: Record<string, number>
}

interface UsersResponse {
  users: ApiProfileRow[]
  total: number
  totalPages: number
}

interface SubscriptionsResponse {
  subscriptions: ApiSubscriptionRow[]
  total: number
  totalPages: number
}

interface UsageResponse {
  logs: ApiUsageRow[]
  total: number
  totalTokens: number
  totalPages: number
}

interface AuditResponse {
  logs: ApiAuditRow[]
  total: number
  totalPages: number
}

interface BugReportsResponse {
  reports: ApiBugReport[]
  total: number
  totalPages: number
}

interface ConversationsResponse {
  conversations: ApiConversationRow[]
  total: number
  totalPages: number
}

interface DocumentsResponse {
  documents: ApiDocumentRow[]
  total: number
  totalPages: number
}

interface SafetyResponse {
  events: ApiSafetyRow[]
  total: number
  totalPages: number
}

interface SettingsResponse {
  settings: import("@zequel/shared/settings/system-settings").SystemSettings
}

interface PlanConfigsResponse {
  plans: import("./types").PlanConfig[]
}

// --- Hooks -----------------------------------------------------------------

export function useStats() {
  const { data, error, isLoading } = useSWR<StatsResponse>("/api/admin/stats", fetcher, swrConfig)
  return { stats: data, error, isLoading }
}

export function useUsers(params: { search?: string; page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set("search", params.search)
  qs.set("page", String(params.page ?? 1))
  qs.set("limit", String(params.limit ?? 50))
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/admin/users?${qs.toString()}`,
    fetcher,
    swrConfig,
  )
  return {
    users: data?.users.map(mapUser) ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  }
}

interface UserDetailResponse {
  user: ApiProfileRow & {
    lastActivity?: string | null
  }
}

// Fetches a single user's full profile (real avatar + conversation/document
// counts) for the admin profile dialog. Only fires when an id is provided.
export function useUser(id: string | null) {
  const { data, error, isLoading } = useSWR<UserDetailResponse>(
    id ? `/api/admin/users/${id}` : null,
    fetcher,
    swrConfig,
  )
  return {
    user: data?.user ? mapUser(data.user) : null,
    error,
    isLoading,
  }
}

export function useSubscriptions(params: { plan?: string; page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.plan && params.plan !== "all") qs.set("plan", params.plan)
  qs.set("page", String(params.page ?? 1))
  qs.set("limit", String(params.limit ?? 50))
  const { data, error, isLoading, mutate } = useSWR<SubscriptionsResponse>(
    `/api/admin/subscriptions?${qs.toString()}`,
    fetcher,
    swrConfig,
  )
  return {
    subscriptions: data?.subscriptions.map(mapSubscription) ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  }
}

export function useAiUsage(params: { status?: string; page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.status && params.status !== "all") qs.set("status", params.status)
  qs.set("page", String(params.page ?? 1))
  qs.set("limit", String(params.limit ?? 50))
  const { data, error, isLoading } = useSWR<UsageResponse>(
    `/api/admin/ai-usage?${qs.toString()}`,
    fetcher,
    swrConfig,
  )
  return {
    logs: data?.logs.map(mapUsage) ?? [],
    total: data?.total ?? 0,
    totalTokens: data?.totalTokens ?? 0,
    error,
    isLoading,
  }
}

export function useAuditLog(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams()
  qs.set("page", String(params.page ?? 1))
  qs.set("limit", String(params.limit ?? 100))
  const { data, error, isLoading } = useSWR<AuditResponse>(
    `/api/admin/audit?${qs.toString()}`,
    fetcher,
    swrConfig,
  )
  return {
    entries: data?.logs.map(mapAudit) ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
  }
}

export function useSupportTickets(params: { status?: string; search?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.status && params.status !== "all") qs.set("status", params.status)
  if (params.search) qs.set("search", params.search)
  qs.set("limit", "100")
  const { data, error, isLoading, mutate } = useSWR<BugReportsResponse>(
    `/api/admin/bug-reports?${qs.toString()}`,
    fetcher,
    swrConfig,
  )
  return {
    tickets: data?.reports.map(mapBugReport) ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  }
}

export function useConversations(params: { search?: string; status?: string; page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set("search", params.search)
  if (params.status && params.status !== "all") qs.set("status", params.status)
  qs.set("page", String(params.page ?? 1))
  qs.set("limit", String(params.limit ?? 100))
  const { data, error, isLoading, mutate } = useSWR<ConversationsResponse>(
    `/api/admin/conversations?${qs.toString()}`,
    fetcher,
    swrConfig,
  )
  return {
    conversations: data?.conversations.map(mapConversation) ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  }
}

export function useDocuments(params: { search?: string; status?: string; page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set("search", params.search)
  if (params.status && params.status !== "all") qs.set("status", params.status)
  qs.set("page", String(params.page ?? 1))
  qs.set("limit", String(params.limit ?? 100))
  const { data, error, isLoading, mutate } = useSWR<DocumentsResponse>(
    `/api/admin/documents?${qs.toString()}`,
    fetcher,
    swrConfig,
  )
  return {
    documents: data?.documents.map(mapDocument) ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  }
}

export function useSafetyEvents(
  params: { search?: string; category?: string; severity?: string; action?: string; page?: number; limit?: number } = {},
) {
  const qs = new URLSearchParams()
  if (params.search) qs.set("search", params.search)
  if (params.category && params.category !== "all") qs.set("category", params.category)
  if (params.severity && params.severity !== "all") qs.set("severity", params.severity)
  if (params.action && params.action !== "all") qs.set("action", params.action)
  qs.set("page", String(params.page ?? 1))
  qs.set("limit", String(params.limit ?? 200))
  const { data, error, isLoading, mutate } = useSWR<SafetyResponse>(
    `/api/admin/safety?${qs.toString()}`,
    fetcher,
    swrConfig,
  )
  return {
    events: data?.events.map(mapSafetyEvent) ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  }
}

export function useSystemSettings() {
  const { data, error, isLoading, mutate } = useSWR<SettingsResponse>(
    "/api/admin/settings",
    fetcher,
    swrConfig,
  )
  return { settings: data?.settings, error, isLoading, mutate }
}

export function usePlanConfigs() {
  const { data, error, isLoading, mutate } = useSWR<PlanConfigsResponse>(
    "/api/admin/plan-configs",
    fetcher,
    swrConfig,
  )
  return { plans: data?.plans ?? [], error, isLoading, mutate }
}

// --- Mutations -------------------------------------------------------------

export async function patchUser(
  id: string,
  action: "update_role" | "update_subscription" | "suspend" | "unsuspend",
  data: Record<string, unknown> = {},
): Promise<void> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Update failed", res.status)
}

export async function patchSubscriptionPlan(
  userId: string,
  plan: SubscriptionTier,
  expiresAt?: string | null,
): Promise<void> {
  // Only send expires_at when explicitly provided so the server can keep its
  // default 30-day behavior when the admin leaves the date blank on a paid plan.
  const data: Record<string, unknown> = { plan }
  if (expiresAt !== undefined) data.expires_at = expiresAt
  return patchUser(userId, "update_subscription", data)
}

export async function savePlanConfig(
  config: import("./types").PlanConfig,
): Promise<void> {
  const res = await fetch("/api/admin/plan-configs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Save failed", res.status)
}

export async function updateBugReportStatus(id: string, status: string): Promise<void> {
  const res = await fetch("/api/admin/bug-reports", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Update failed", res.status)
}

export async function saveSettings(
  settings: Partial<import("@zequel/shared/settings/system-settings").SystemSettings>,
): Promise<void> {
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Save failed", res.status)
}

export async function updateConversationStatus(
  id: string,
  status: Conversation["status"],
): Promise<void> {
  const res = await fetch("/api/admin/conversations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Update failed", res.status)
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/admin/documents?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Delete failed", res.status)
}

export async function updateSafetyAction(
  id: string,
  action: SafetyEvent["action"],
): Promise<void> {
  const res = await fetch("/api/admin/safety", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Update failed", res.status)
}

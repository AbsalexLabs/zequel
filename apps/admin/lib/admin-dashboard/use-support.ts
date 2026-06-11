"use client"

import useSWR from "swr"
import { fetcher } from "./api"
import type {
  SupportListResponse,
  SupportTicketDetail,
  TicketSource,
  TicketStatus,
} from "./support-center"

// ---------------------------------------------------------------------------
// Support Center data hooks. All reads go through /api/admin/support/* and
// mutations re-validate the affected SWR caches.
// ---------------------------------------------------------------------------

export interface TicketListParams {
  category: string
  source?: TicketSource | "all"
  status?: TicketStatus | "all"
  search?: string
  sort?: "newest" | "updated"
}

function listKey(params: TicketListParams): string {
  const sp = new URLSearchParams()
  sp.set("category", params.category)
  if (params.source && params.source !== "all") sp.set("source", params.source)
  if (params.status && params.status !== "all") sp.set("status", params.status)
  if (params.search) sp.set("search", params.search)
  sp.set("sort", params.sort || "newest")
  return `/api/admin/support/tickets?${sp.toString()}`
}

export function useSupportTickets(params: TicketListParams) {
  const { data, error, isLoading, mutate } = useSWR<SupportListResponse>(
    listKey(params),
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )
  return { data, error, isLoading, mutate }
}

export function useSupportTicket(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ ticket: SupportTicketDetail }>(
    id ? `/api/admin/support/tickets/${id}` : null,
    fetcher,
    { revalidateOnFocus: false },
  )
  return { ticket: data?.ticket, error, isLoading, mutate }
}

// --- Mutations -------------------------------------------------------------

async function send<T>(url: string, method: "POST" | "PATCH", body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
  return json as T
}

export type MessageKind = "admin" | "email" | "note"

export function postMessage(
  ticketId: string,
  payload: { kind: MessageKind; body: string; subject?: string },
) {
  return send(`/api/admin/support/tickets/${ticketId}/messages`, "POST", payload)
}

export type TicketPatch = {
  status?: TicketStatus
  assignedAdminId?: string | null
  forwardToSuperAdmin?: boolean
}

export function patchTicket(ticketId: string, patch: TicketPatch) {
  return send(`/api/admin/support/tickets/${ticketId}`, "PATCH", patch)
}

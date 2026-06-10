"use client"

import useSWR from "swr"
import { fetcher, ApiError } from "./api"

// ---------------------------------------------------------------------------
// Client data layer for the Website CMS module.
// All CMS pages read/write live data through these helpers, backed by the
// generic /api/admin/cms/[resource] route.
// ---------------------------------------------------------------------------

interface CmsListResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface CmsItemResponse<T> {
  item: T
}

export interface CmsListParams {
  search?: string
  status?: string
  limit?: number
  page?: number
}

function buildQuery(params: CmsListParams): string {
  const qs = new URLSearchParams()
  if (params.search) qs.set("search", params.search)
  if (params.status && params.status !== "all") qs.set("status", params.status)
  qs.set("page", String(params.page ?? 1))
  qs.set("limit", String(params.limit ?? 200))
  return qs.toString()
}

/** Generic list hook for any CMS resource. */
export function useCmsList<T>(resource: string, params: CmsListParams = {}) {
  const key = `/api/admin/cms/${resource}?${buildQuery(params)}`
  const { data, error, isLoading, mutate } = useSWR<CmsListResponse<T>>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  }
}

export async function createCmsItem<T>(resource: string, payload: Partial<T>): Promise<T> {
  const res = await fetch(`/api/admin/cms/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Create failed", res.status)
  return (body as CmsItemResponse<T>).item
}

export async function updateCmsItem<T>(resource: string, id: string, payload: Partial<T>): Promise<T> {
  const res = await fetch(`/api/admin/cms/${resource}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...payload }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Update failed", res.status)
  return (body as CmsItemResponse<T>).item
}

export async function deleteCmsItem(resource: string, id: string): Promise<void> {
  const res = await fetch(`/api/admin/cms/${resource}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.error || "Delete failed", res.status)
}

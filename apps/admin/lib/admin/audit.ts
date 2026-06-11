import { createServiceClient } from '@zequel/shared/supabase/service'
import { headers } from 'next/headers'

export interface AuditLogEntry {
  admin_id: string
  action: string
  target_type: 'user' | 'subscription' | 'setting' | 'system' | 'plan'
  target_id?: string
  details?: Record<string, unknown>
  /**
   * Explicit IP override. When omitted, the IP is resolved automatically from
   * the incoming request headers (x-forwarded-for / x-real-ip / cf-connecting-ip).
   */
  ip_address?: string | null
}

/**
 * Resolve the originating client IP from the current request's headers.
 * Vercel/most proxies set `x-forwarded-for` (comma-separated list, client first).
 */
export async function getClientIP(): Promise<string | null> {
  try {
    const headersList = await headers()
    // `x-forwarded-for` is a comma-separated list with the original client
    // first. On Vercel `x-vercel-forwarded-for` carries the real client IP.
    const forwarded =
      headersList.get('x-forwarded-for') || headersList.get('x-vercel-forwarded-for')
    const first = forwarded?.split(',')[0]?.trim()
    return (
      first ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') ||
      null
    )
  } catch {
    // `headers()` throws outside a request scope (e.g. background jobs).
    return null
  }
}

export async function logAdminAction(entry: AuditLogEntry) {
  const supabase = createServiceClient()

  // Capture the client IP for the audit trail. An explicit value wins; otherwise
  // we resolve it from the request headers.
  const ipAddress =
    entry.ip_address !== undefined ? entry.ip_address : await getClientIP()

  await supabase.from('admin_audit_logs').insert({
    admin_id: entry.admin_id,
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id,
    details: entry.details,
    ip_address: ipAddress,
    created_at: new Date().toISOString(),
  })
}

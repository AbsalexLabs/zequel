import { createServiceClient } from '@/lib/supabase/service'

export interface AuditLogEntry {
  admin_id: string
  action: string
  target_type: 'user' | 'subscription' | 'setting' | 'system'
  target_id?: string
  details?: Record<string, unknown>
}

export async function logAdminAction(entry: AuditLogEntry) {
  const supabase = createServiceClient()
  
  await supabase.from('admin_audit_logs').insert({
    admin_id: entry.admin_id,
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id,
    details: entry.details,
    created_at: new Date().toISOString(),
  })
}

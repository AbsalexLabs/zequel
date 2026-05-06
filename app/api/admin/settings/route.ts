import { verifyAdmin, adminResponse, adminError } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { logAdminAction } from '@/lib/admin/audit'
import { clearSettingsCache, type SystemSettings } from '@/lib/settings/system-settings'

// Default settings structure
const DEFAULT_SETTINGS: SystemSettings = {
  ai_enabled: true,
  free_daily_limit: 20,
  premium_daily_limit: 100,
  max_file_uploads_free: 5,
  max_file_uploads_premium: 50,
  max_tokens_per_request: 16384,
  default_model: 'google/gemini-2.0-flash-001',
  file_uploads_enabled: true,
  max_file_size_mb: 10,
  maintenance_mode: false,
  // Advanced rate limiting defaults
  max_requests_per_minute: 15,
  max_requests_per_hour: 100,
  burst_limit_threshold: 5,
  burst_cooldown_seconds: 30,
  // Response quality defaults
  response_style: 'detailed',
}

export async function GET() {
  const { user, error } = await verifyAdmin()
  if (error || !user) {
    return adminError(error || 'Unauthorized', 401)
  }

  const supabase = createServiceClient()

  const { data: rows, error: queryError } = await supabase
    .from('system_settings')
    .select('key, value')

  if (queryError) {
    return adminResponse({ settings: DEFAULT_SETTINGS })
  }

  // Convert rows to settings object
  const settings: SystemSettings = { ...DEFAULT_SETTINGS }
  
  for (const row of (rows || [])) {
    const key = row.key as keyof SystemSettings
    if (key in settings) {
      const value = row.value
      if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
        settings[key] = (value === 'true' || value === true) as never
      } else if (typeof DEFAULT_SETTINGS[key] === 'number') {
        settings[key] = Number(value) as never
      } else {
        settings[key] = String(value) as never
      }
    }
  }

  return adminResponse({ settings })
}

export async function PATCH(request: Request) {
  const { user: admin, error } = await verifyAdmin()
  if (error || !admin) {
    return adminError(error || 'Unauthorized', 401)
  }

  // Only superadmins can modify settings
  if (admin.role !== 'superadmin') {
    return adminError('Superadmin access required', 403)
  }

  const body = await request.json()
  const { key, value } = body

  if (!key) {
    return adminError('Setting key is required', 400)
  }

  // Validate key exists in settings
  if (!(key in DEFAULT_SETTINGS)) {
    return adminError(`Invalid setting key: ${key}`, 400)
  }

  // Validate value type
  const expectedType = typeof DEFAULT_SETTINGS[key as keyof SystemSettings]
  if (expectedType === 'boolean' && typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
    return adminError(`Setting ${key} must be a boolean`, 400)
  }
  if (expectedType === 'number' && isNaN(Number(value))) {
    return adminError(`Setting ${key} must be a number`, 400)
  }

  const supabase = createServiceClient()

  // Store value as string for consistency
  const storedValue = String(value)

  const { error: upsertError } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value: storedValue,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    }, { onConflict: 'key' })

  if (upsertError) {
    return adminError(upsertError.message, 500)
  }

  // Clear settings cache so changes take effect immediately
  clearSettingsCache()

  await logAdminAction({
    admin_id: admin.id,
    action: 'update_setting',
    target_type: 'setting',
    target_id: key,
    details: { key, value: storedValue, previous_type: expectedType },
  })

  return adminResponse({ success: true, message: 'Setting updated', key, value: storedValue })
}

// Bulk update settings
export async function PUT(request: Request) {
  const { user: admin, error } = await verifyAdmin()
  if (error || !admin) {
    return adminError(error || 'Unauthorized', 401)
  }

  // Only superadmins can modify settings
  if (admin.role !== 'superadmin') {
    return adminError('Superadmin access required', 403)
  }

  const body = await request.json()
  const { settings } = body as { settings: Partial<SystemSettings> }

  if (!settings || typeof settings !== 'object') {
    return adminError('Settings object is required', 400)
  }

  const supabase = createServiceClient()
  const updates: Array<{ key: string; value: string; updated_at: string; updated_by: string }> = []

  // Validate and prepare updates
  for (const [key, value] of Object.entries(settings)) {
    if (!(key in DEFAULT_SETTINGS)) {
      return adminError(`Invalid setting key: ${key}`, 400)
    }
    updates.push({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
  }

  // Upsert all settings
  const { error: upsertError } = await supabase
    .from('system_settings')
    .upsert(updates, { onConflict: 'key' })

  if (upsertError) {
    return adminError(upsertError.message, 500)
  }

  // Clear settings cache
  clearSettingsCache()

  await logAdminAction({
    admin_id: admin.id,
    action: 'bulk_update_settings',
    target_type: 'system',
    target_id: 'multiple',
    details: { updated_keys: Object.keys(settings) },
  })

  return adminResponse({ success: true, message: 'Settings updated', updated: Object.keys(settings) })
}

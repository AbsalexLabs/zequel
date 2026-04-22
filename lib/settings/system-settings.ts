import { createServiceClient } from '@/lib/supabase/service'

// Response style type
export type ResponseStyle = 'concise' | 'detailed' | 'academic'

// System settings interface - single source of truth
export interface SystemSettings {
  ai_enabled: boolean
  free_daily_limit: number
  premium_daily_limit: number
  max_file_uploads_free: number
  max_file_uploads_premium: number
  max_tokens_per_request: number
  default_model: string
  file_uploads_enabled: boolean
  max_file_size_mb: number
  maintenance_mode: boolean
  // Advanced rate limiting settings
  max_requests_per_minute: number
  max_requests_per_hour: number
  burst_limit_threshold: number
  burst_cooldown_seconds: number
  // Response quality settings
  response_style: ResponseStyle
}

// Default settings - used if database is unavailable
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

// Cache settings for 60 seconds to reduce DB calls
let cachedSettings: SystemSettings | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60 * 1000 // 60 seconds

/**
 * Fetch system settings from database (singleton pattern)
 * Caches results for 60 seconds to reduce database load
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const now = Date.now()
  
  // Return cached settings if still valid
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSettings
  }

  try {
    const supabase = createServiceClient()
    
    const { data: rows, error } = await supabase
      .from('system_settings')
      .select('key, value')

    if (error || !rows || rows.length === 0) {
      // Return defaults if table is empty or error
      return DEFAULT_SETTINGS
    }

    // Convert rows to settings object
    const settings: SystemSettings = { ...DEFAULT_SETTINGS }
    
    for (const row of rows) {
      const key = row.key as keyof SystemSettings
      if (key in settings) {
        // Parse value based on expected type
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

    // Cache the settings
    cachedSettings = settings
    cacheTimestamp = now

    return settings
  } catch (err) {
    console.error('Failed to fetch system settings:', err)
    return DEFAULT_SETTINGS
  }
}

/**
 * Clear settings cache (call after admin updates)
 */
export function clearSettingsCache(): void {
  cachedSettings = null
  cacheTimestamp = 0
}

/**
 * Check if AI is enabled globally
 */
export async function isAIEnabled(): Promise<boolean> {
  const settings = await getSystemSettings()
  return settings.ai_enabled && !settings.maintenance_mode
}

/**
 * Get daily limit based on user plan
 */
export async function getDailyLimit(isPremium: boolean): Promise<number> {
  const settings = await getSystemSettings()
  return isPremium ? settings.premium_daily_limit : settings.free_daily_limit
}

/**
 * Get file upload limit based on user plan
 */
export async function getFileUploadLimit(isPremium: boolean): Promise<number> {
  const settings = await getSystemSettings()
  return isPremium ? settings.max_file_uploads_premium : settings.max_file_uploads_free
}

/**
 * Get max tokens per request
 */
export async function getMaxTokens(): Promise<number> {
  const settings = await getSystemSettings()
  return settings.max_tokens_per_request
}

/**
 * Get default model
 */
export async function getDefaultModel(): Promise<string> {
  const settings = await getSystemSettings()
  return settings.default_model
}

/**
 * Check if file uploads are enabled
 */
export async function isFileUploadsEnabled(): Promise<boolean> {
  const settings = await getSystemSettings()
  return settings.file_uploads_enabled
}

/**
 * Get max file size in bytes
 */
export async function getMaxFileSize(): Promise<number> {
  const settings = await getSystemSettings()
  return settings.max_file_size_mb * 1024 * 1024
}

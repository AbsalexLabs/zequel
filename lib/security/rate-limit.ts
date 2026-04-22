import type { RequestType } from '@/lib/validation/ai-schema'

// In-memory rate limit store (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Rate limits per endpoint per minute
const RATE_LIMITS: Record<RequestType, { free: number; premium: number }> = {
  chat: { free: 20, premium: 100 },
  query: { free: 10, premium: 50 },
  extract: { free: 10, premium: 30 },
}

const WINDOW_MS = 60 * 1000 // 1 minute window

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
  limit: number
}

export function checkRateLimit(
  userId: string,
  endpoint: RequestType,
  isPremium: boolean = false
): RateLimitResult {
  const key = `${userId}:${endpoint}`
  const now = Date.now()
  const limit = isPremium ? RATE_LIMITS[endpoint].premium : RATE_LIMITS[endpoint].free

  const current = rateLimitStore.get(key)

  // If no record or window expired, reset
  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: limit - 1, resetIn: WINDOW_MS, limit }
  }

  // Check if limit exceeded
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: current.resetAt - now,
      limit,
    }
  }

  // Increment count
  current.count++
  rateLimitStore.set(key, current)

  return {
    allowed: true,
    remaining: limit - current.count,
    resetIn: current.resetAt - now,
    limit,
  }
}

// Cleanup old entries periodically (call this in a background job or API warmup)
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

// Clear rate limit for a user (e.g., after subscription upgrade)
export function clearRateLimit(userId: string) {
  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(`${userId}:`)) {
      rateLimitStore.delete(key)
    }
  }
}

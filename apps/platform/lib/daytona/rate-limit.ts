import { SandboxError } from './errors'

export type RateBucket = 'lifecycle' | 'fs' | 'exec' | 'terminal_input' | 'terminal_open' | 'server'

const LIMITS: Record<RateBucket, { max: number; windowMs: number }> = {
  lifecycle: { max: 20, windowMs: 60_000 },
  fs: { max: 300, windowMs: 60_000 },
  exec: { max: 60, windowMs: 60_000 },
  terminal_input: { max: 1500, windowMs: 60_000 },
  terminal_open: { max: 30, windowMs: 60_000 },
  server: { max: 120, windowMs: 60_000 },
}

const hits = new Map<string, number[]>()

/**
 * Per-user sliding-window limiter. It is per server instance (best effort on
 * serverless); the sandbox provider enforces its own limits upstream.
 */
export function enforceRateLimit(userId: string, bucket: RateBucket, now = Date.now()) {
  const { max, windowMs } = LIMITS[bucket]
  const key = `${bucket}:${userId}`
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    throw new SandboxError('rate_limited', 'Too many requests. Please slow down.', 429)
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  }
}

export function resetRateLimitsForTests() {
  hits.clear()
}

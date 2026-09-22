import { Daytona } from '@daytona/sdk'

/**
 * Server-only Daytona client factory.
 *
 * SECURITY: This module must NEVER be imported into a client component or any
 * browser bundle. It reads the privileged `DAYTONA_API_KEY` from the server
 * environment. The browser talks to our own API routes; those routes are the
 * only thing that ever touches this client.
 *
 * The client is intentionally lightweight to construct (it just holds config),
 * but we still memoize a single instance per server runtime to avoid
 * re-reading config on every request.
 */

/** Thrown when Daytona is not configured on the server. Safe to surface as a
 *  concise, non-sensitive message to the client. */
export class DaytonaConfigError extends Error {
  readonly code = 'DAYTONA_NOT_CONFIGURED'
  constructor(message = 'Coding runtime is not configured. Set DAYTONA_API_KEY on the server to enable sandboxes.') {
    super(message)
    this.name = 'DaytonaConfigError'
  }
}

let cached: Daytona | null = null

/** Returns true when a Daytona API key is present in the server environment. */
export function isDaytonaConfigured(): boolean {
  return Boolean(process.env.DAYTONA_API_KEY)
}

/**
 * Returns a memoized server-side Daytona client.
 * @throws {DaytonaConfigError} when `DAYTONA_API_KEY` is missing.
 */
export function getDaytona(): Daytona {
  if (typeof window !== 'undefined') {
    throw new Error('getDaytona() must only be called on the server.')
  }
  const apiKey = process.env.DAYTONA_API_KEY
  if (!apiKey) {
    throw new DaytonaConfigError()
  }
  if (cached) return cached
  cached = new Daytona({
    apiKey,
    // Optional overrides; only applied when explicitly provided.
    ...(process.env.DAYTONA_API_URL ? { apiUrl: process.env.DAYTONA_API_URL } : {}),
    ...(process.env.DAYTONA_TARGET ? { target: process.env.DAYTONA_TARGET } : {}),
  })
  return cached
}

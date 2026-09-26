import { Daytona } from '@daytona/sdk'
import { SandboxError } from './errors'
import { logDaytona } from './logger'

if (typeof window !== 'undefined') {
  throw new Error('lib/daytona must only be imported on the server.')
}

let client: Daytona | null = null

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export function isDaytonaConfigured(): boolean {
  return Boolean(process.env.DAYTONA_API_KEY)
}

/**
 * Lazily construct a single Daytona client per server instance. The API key is
 * read from server-only env vars and never leaves this process.
 *
 * `DAYTONA_SERVER_URL` is accepted as a fallback because older docs used it,
 * but the current SDK name is `DAYTONA_API_URL`.
 */
export function getDaytona(): Daytona {
  if (!isDaytonaConfigured()) {
    throw new SandboxError(
      'not_configured',
      'Cloud sandboxes are not configured on this server.',
      503,
    )
  }
  if (!client) {
    const apiUrl = process.env.DAYTONA_API_URL || process.env.DAYTONA_SERVER_URL || undefined
    if (!process.env.DAYTONA_API_URL && process.env.DAYTONA_SERVER_URL) {
      logDaytona('warn', 'config.deprecated_server_url', { hint: 'rename DAYTONA_SERVER_URL to DAYTONA_API_URL' })
    }
    client = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY,
      apiUrl,
      target: process.env.DAYTONA_TARGET || undefined,
    })
  }
  return client
}

export function resetDaytonaClientForTests() {
  client = null
}

export const SANDBOX_POLICY = {
  get autoStopMinutes() {
    return intFromEnv('DAYTONA_AUTO_STOP_MINUTES', 30)
  },
  get autoArchiveMinutes() {
    return intFromEnv('DAYTONA_AUTO_ARCHIVE_MINUTES', 60 * 24 * 7)
  },
  get snapshot() {
    return process.env.DAYTONA_SNAPSHOT || undefined
  },
}

export const DEFAULT_HOME_DIR = '/home/daytona'
export const PROJECT_DIR_NAME = 'project'

export const LABELS = {
  app: 'zequel-app',
  project: 'zequel-project-id',
  user: 'zequel-user-id',
} as const

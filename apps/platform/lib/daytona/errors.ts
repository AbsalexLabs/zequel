export type SandboxErrorCode =
  | 'not_configured'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'no_sandbox'
  | 'sandbox_missing'
  | 'sandbox_not_running'
  | 'invalid_input'
  | 'conflict'
  | 'too_large'
  | 'rate_limited'
  | 'timeout'
  | 'migration_required'
  | 'upstream'
  | 'internal'

/**
 * Error type used across the Daytona integration. `message` is always safe to
 * return to the browser: it never contains credentials, API URLs, or raw
 * upstream payloads.
 */
export class SandboxError extends Error {
  readonly code: SandboxErrorCode
  readonly status: number

  constructor(code: SandboxErrorCode, message: string, status: number) {
    super(message)
    this.name = 'SandboxError'
    this.code = code
    this.status = status
  }
}

interface UpstreamLike {
  name?: string
  message?: string
  statusCode?: number
}

/**
 * Normalize anything thrown by the Daytona SDK (or our own code) into a
 * SandboxError with a safe, user-facing message. The SDK exposes `statusCode`
 * on DaytonaError subclasses; we duck-type it so unit tests can use plain
 * objects.
 */
export function toSandboxError(err: unknown, fallbackMessage = 'Sandbox request failed'): SandboxError {
  if (err instanceof SandboxError) return err
  const e = (err ?? {}) as UpstreamLike
  const name = e.name ?? ''
  const status = typeof e.statusCode === 'number' ? e.statusCode : undefined

  if (name === 'DaytonaFileNotFoundError' || status === 404) {
    return new SandboxError('not_found', 'The requested resource was not found in the sandbox.', 404)
  }
  if (name.includes('Timeout') || status === 408 || status === 504) {
    return new SandboxError('timeout', 'The sandbox did not respond in time. Please retry.', 504)
  }
  if (status === 409) {
    return new SandboxError('conflict', 'The sandbox is busy with another operation. Please retry.', 409)
  }
  if (status === 429) {
    return new SandboxError('rate_limited', 'Sandbox provider rate limit reached. Please wait and retry.', 429)
  }
  if (status === 401 || status === 403) {
    // Our API key was rejected — a server configuration problem, not the user's.
    return new SandboxError('upstream', 'The sandbox provider rejected the request. Check the server configuration.', 502)
  }
  if (name === 'DaytonaConnectionError' || name === 'DaytonaConnectionTimeoutError') {
    return new SandboxError('upstream', 'Could not connect to the sandbox. It may be stopped or restarting.', 502)
  }
  if (status && status >= 400 && status < 500) {
    return new SandboxError('invalid_input', fallbackMessage, 400)
  }
  return new SandboxError('upstream', fallbackMessage, 502)
}

export function isNotFound(err: unknown): boolean {
  const e = (err ?? {}) as UpstreamLike
  return (
    (err instanceof SandboxError && err.code === 'not_found') ||
    e.statusCode === 404 ||
    e.name === 'DaytonaNotFoundError' ||
    e.name === 'DaytonaFileNotFoundError'
  )
}

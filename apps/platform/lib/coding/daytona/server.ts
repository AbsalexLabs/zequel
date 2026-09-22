import { DaytonaConfigError, isDaytonaConfigured } from './client'
import { DaytonaCodingRuntime } from './runtime'
import {
  SandboxRegistryError,
  UnauthorizedError,
  getBinding,
  requireUserId,
} from './registry'

/**
 * Shared request helpers for the Daytona API routes. This is the single place
 * that turns an authenticated request + projectId into an authorized,
 * sandbox-bound runtime — so every route enforces the same ownership boundary.
 */

export class NotFoundError extends Error {
  readonly code = 'PROJECT_NOT_FOUND'
  constructor(message = 'No sandbox is bound to this project.') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Resolve a `DaytonaCodingRuntime` for the current user + project.
 * Throws `UnauthorizedError` / `NotFoundError` / config errors as appropriate.
 */
export async function resolveRuntime(projectId: string): Promise<{
  runtime: DaytonaCodingRuntime
  userId: string
}> {
  if (!isDaytonaConfigured()) throw new DaytonaConfigError()
  const userId = await requireUserId()
  const binding = await getBinding(projectId, userId)
  if (!binding) throw new NotFoundError()
  const runtime = new DaytonaCodingRuntime({
    projectId: binding.projectId,
    userId: binding.userId,
    sandboxId: binding.sandboxId,
    workdir: binding.workdir,
  })
  return { runtime, userId }
}

interface ErrorShape {
  error: string
  code: string
  status: number
}

/**
 * Map any thrown value to a concise, non-sensitive client error. Never leaks
 * API keys, stack traces, or infrastructure details.
 */
export function toErrorResponse(err: unknown): ErrorShape {
  if (err instanceof DaytonaConfigError) {
    return { error: err.message, code: err.code, status: 503 }
  }
  if (err instanceof UnauthorizedError) {
    return { error: err.message, code: err.code, status: 401 }
  }
  if (err instanceof NotFoundError) {
    return { error: err.message, code: err.code, status: 404 }
  }
  if (err instanceof SandboxRegistryError) {
    return { error: err.message, code: err.code, status: 503 }
  }
  // Generic fallback — log server-side detail, return a safe message.
  console.error('[coding/daytona] unexpected error:', err)
  return {
    error: 'The coding runtime encountered an error. Please try again.',
    code: 'RUNTIME_ERROR',
    status: 500,
  }
}

/** Standard JSON response helper. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Wrap a route handler with uniform error handling. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (err) {
    const { error, code, status } = toErrorResponse(err)
    return json({ error, code }, status)
  }
}

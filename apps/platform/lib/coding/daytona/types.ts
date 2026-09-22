/**
 * Types shared between the server-side Daytona layer and the API routes.
 * These are safe to import from both server and client (they contain no
 * privileged data), but the concrete Daytona SDK objects never cross the
 * network boundary — only these plain shapes do.
 */

export type SandboxStatus =
  | 'creating'
  | 'active'
  | 'idle'
  | 'stopped'
  | 'archived'
  | 'error'
  | 'deleted'

/**
 * The metadata relationship persisted in our own database:
 *
 *   Zequel Project  ->  Daytona Sandbox
 *
 * We deliberately do NOT persist the sandbox filesystem — the sandbox *is* the
 * working filesystem. Only this lightweight binding lives in our DB.
 */
export interface SandboxRecord {
  projectId: string
  userId: string
  sandboxId: string
  name: string
  status: SandboxStatus
  runtime: 'daytona'
  workdir: string
  createdAt: string
  updatedAt: string
}

/** Everything a route needs to identify a caller's sandbox binding. */
export interface SandboxBinding {
  projectId: string
  userId: string
  sandboxId: string
  workdir: string
}

/** A single seed file used to bootstrap a new project's sandbox. */
export interface SeedFile {
  /** Path relative to the project workdir, e.g. "src/main.js". */
  path: string
  content: string
}

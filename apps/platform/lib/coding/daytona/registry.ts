import { createClient } from '@zequel/shared/supabase/server'
import type { SandboxRecord, SandboxStatus } from './types'

/**
 * Persistence + authorization boundary for the Project -> Sandbox binding.
 *
 * We store ONLY metadata (never the sandbox filesystem). Every lookup is scoped
 * to the authenticated user id, so one user can never reach another user's
 * sandbox even if they guess a project id.
 *
 * Backing table (see scripts/coding_sandboxes.sql):
 *
 *   coding_sandboxes(project_id pk, user_id, sandbox_id, name, status,
 *                    runtime, workdir, created_at, updated_at)
 *
 * If the table has not been created yet, methods throw `SandboxRegistryError`
 * so routes can surface a concise "runtime storage not ready" message instead
 * of a raw Postgres error.
 */

export class SandboxRegistryError extends Error {
  readonly code = 'SANDBOX_REGISTRY_UNAVAILABLE'
  constructor(message = 'Coding runtime storage is not ready. Apply the coding_sandboxes migration.') {
    super(message)
    this.name = 'SandboxRegistryError'
  }
}

const TABLE = 'coding_sandboxes'

interface Row {
  project_id: string
  user_id: string
  sandbox_id: string
  name: string
  status: SandboxStatus
  runtime: 'daytona'
  workdir: string
  created_at: string
  updated_at: string
}

function toRecord(row: Row): SandboxRecord {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    sandboxId: row.sandbox_id,
    name: row.name,
    status: row.status,
    runtime: row.runtime,
    workdir: row.workdir,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Raised by callers when the current request has no authenticated user. */
export class UnauthorizedError extends Error {
  readonly code = 'UNAUTHORIZED'
  constructor(message = 'You must be signed in to use Coding Mode.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/** Resolves the authenticated user id for the current request, or throws. */
export async function requireUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()
  return user.id
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  // Postgres "undefined_table" or PostgREST "relation does not exist".
  return error.code === '42P01' || /does not exist/i.test(error.message ?? '')
}

/** Insert a new Project -> Sandbox binding. */
export async function createBinding(input: {
  projectId: string
  userId: string
  sandboxId: string
  name: string
  workdir: string
  status?: SandboxStatus
}): Promise<SandboxRecord> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const row: Row = {
    project_id: input.projectId,
    user_id: input.userId,
    sandbox_id: input.sandboxId,
    name: input.name,
    status: input.status ?? 'active',
    runtime: 'daytona',
    workdir: input.workdir,
    created_at: now,
    updated_at: now,
  }
  const { data, error } = await supabase.from(TABLE).insert(row).select().single()
  if (error) {
    if (isMissingTable(error)) throw new SandboxRegistryError()
    throw new Error(error.message)
  }
  return toRecord(data as Row)
}

/**
 * Look up a binding, enforcing ownership. Returns null when no binding exists
 * for this user+project. Throws `SandboxRegistryError` if storage is missing.
 */
export async function getBinding(projectId: string, userId: string): Promise<SandboxRecord | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) throw new SandboxRegistryError()
    throw new Error(error.message)
  }
  return data ? toRecord(data as Row) : null
}

/** List all sandbox bindings owned by a user. */
export async function listBindings(userId: string): Promise<SandboxRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) {
    if (isMissingTable(error)) throw new SandboxRegistryError()
    throw new Error(error.message)
  }
  return (data as Row[]).map(toRecord)
}

/** Update mutable fields of a binding, scoped to the owner. */
export async function updateBinding(
  projectId: string,
  userId: string,
  patch: Partial<Pick<SandboxRecord, 'status' | 'name' | 'sandboxId'>>,
): Promise<void> {
  const supabase = await createClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.status) update.status = patch.status
  if (patch.name) update.name = patch.name
  if (patch.sandboxId) update.sandbox_id = patch.sandboxId
  const { error } = await supabase.from(TABLE).update(update).eq('project_id', projectId).eq('user_id', userId)
  if (error) {
    if (isMissingTable(error)) throw new SandboxRegistryError()
    throw new Error(error.message)
  }
}

/** Remove a binding row (called after the sandbox is deleted). */
export async function deleteBinding(projectId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from(TABLE).delete().eq('project_id', projectId).eq('user_id', userId)
  if (error) {
    if (isMissingTable(error)) throw new SandboxRegistryError()
    throw new Error(error.message)
  }
}

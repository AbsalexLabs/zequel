import { createClient } from '@zequel/shared/supabase/server'
import { SandboxError } from './errors'
import { logDaytona } from './logger'

export interface ProjectRecord {
  id: string
  user_id: string
  name: string
  daytona_sandbox_id: string | null
  daytona_sandbox_state: string | null
  daytona_workdir: string | null
}

/**
 * Persistence for the project <-> sandbox association. Backed by the user's
 * RLS-scoped Supabase client, so every write is also constrained to rows the
 * user owns at the database level.
 */
export interface ProjectSandboxRepo {
  /** Atomically attach a sandbox only if the project has none. Returns false if another request won. */
  claimSandbox(projectId: string, sandboxId: string, workdir: string, state: string): Promise<boolean>
  updateState(projectId: string, sandboxId: string, state: string): Promise<void>
  /** Detach only if the stored id still matches, so a concurrent re-association is never clobbered. */
  clearSandbox(projectId: string, sandboxId: string): Promise<void>
  reload(projectId: string): Promise<ProjectRecord | null>
}

export interface ProjectAccess {
  userId: string
  project: ProjectRecord
  repo: ProjectSandboxRepo
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PROJECT_COLUMNS = 'id, user_id, name, daytona_sandbox_id, daytona_sandbox_state, daytona_workdir'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (error.code === '42703' || /daytona_\w+/.test(error.message ?? '')))
}

export function createSupabaseSandboxRepo(db: SupabaseServerClient, userId: string): ProjectSandboxRepo {
  const now = () => new Date().toISOString()
  return {
    async claimSandbox(projectId, sandboxId, workdir, state) {
      const { data, error } = await db
        .from('coding_projects')
        .update({
          daytona_sandbox_id: sandboxId,
          daytona_workdir: workdir,
          daytona_sandbox_state: state,
          daytona_last_synced_at: now(),
        })
        .eq('id', projectId)
        .eq('user_id', userId)
        .is('daytona_sandbox_id', null)
        .select('id')
      if (error) throw new SandboxError('internal', 'Could not save the sandbox association.', 500)
      return (data ?? []).length > 0
    },
    async updateState(projectId, sandboxId, state) {
      await db
        .from('coding_projects')
        .update({ daytona_sandbox_state: state, daytona_last_synced_at: now() })
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('daytona_sandbox_id', sandboxId)
    },
    async clearSandbox(projectId, sandboxId) {
      await db
        .from('coding_projects')
        .update({
          daytona_sandbox_id: null,
          daytona_sandbox_state: null,
          daytona_workdir: null,
          daytona_last_synced_at: now(),
        })
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('daytona_sandbox_id', sandboxId)
    },
    async reload(projectId) {
      const { data } = await db
        .from('coding_projects')
        .select(PROJECT_COLUMNS)
        .eq('id', projectId)
        .eq('user_id', userId)
        .maybeSingle()
      return (data as ProjectRecord | null) ?? null
    },
  }
}

/**
 * Authenticate the caller from their Supabase session cookie and load the
 * project ONLY if they own it. The project id comes from the URL but is never
 * trusted on its own: the query is scoped by the session user id and by RLS.
 * Unknown and foreign projects both yield 404 so ownership isn't disclosed.
 */
export async function requireProjectAccess(projectId: string): Promise<ProjectAccess> {
  if (!UUID_RE.test(projectId)) {
    throw new SandboxError('invalid_input', 'Invalid project id.', 400)
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new SandboxError('not_configured', 'Database is not configured.', 503)
  }

  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) throw new SandboxError('unauthorized', 'Sign in to use Coding Mode.', 401)

  const { data, error } = await db
    .from('coding_projects')
    .select(PROJECT_COLUMNS)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (isMissingColumn(error)) {
    logDaytona('error', 'db.migration_missing', { table: 'coding_projects' })
    throw new SandboxError(
      'migration_required',
      'The database is missing the sandbox columns. Run scripts/daytona-sandbox.sql.',
      503,
    )
  }
  if (error) throw new SandboxError('internal', 'Could not load the project.', 500)
  if (!data) throw new SandboxError('not_found', 'Project not found.', 404)

  return {
    userId: user.id,
    project: data as ProjectRecord,
    repo: createSupabaseSandboxRepo(db, user.id),
  }
}

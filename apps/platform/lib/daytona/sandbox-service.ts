import type { Daytona, Sandbox } from '@daytona/sdk'
import {
  DEFAULT_HOME_DIR,
  LABELS,
  PROJECT_DIR_NAME,
  SANDBOX_POLICY,
  getDaytona,
} from './config'
import type { ProjectAccess } from './access'
import { SandboxError, isNotFound, toSandboxError } from './errors'
import { logDaytona } from './logger'

export type SandboxPhase =
  | 'none'
  | 'creating'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'archived'
  | 'error'
  | 'missing'

export interface SandboxStatus {
  phase: SandboxPhase
  sandboxId: string | null
  state: string | null
  error?: string
  recoverable?: boolean
  autoStopMinutes?: number
}

export interface RunningSandbox {
  sandbox: Sandbox
  root: string
}

const START_TIMEOUT_S = 120
const STOP_TIMEOUT_S = 60
const CREATE_TIMEOUT_S = 120

/** Map a raw Daytona sandbox state onto the phases the UI understands. */
export function phaseFromState(state: string | undefined | null): SandboxPhase {
  switch (state) {
    case 'started':
      return 'running'
    case 'creating':
    case 'pending_build':
    case 'building_snapshot':
    case 'pulling_snapshot':
      return 'creating'
    case 'starting':
    case 'restoring':
    case 'resizing':
      return 'starting'
    case 'stopping':
    case 'archiving':
      return 'stopping'
    case 'stopped':
      return 'stopped'
    case 'archived':
      return 'archived'
    case 'destroyed':
    case 'destroying':
      return 'missing'
    case 'error':
    case 'build_failed':
      return 'error'
    default:
      return 'error'
  }
}

function statusOf(sandbox: Sandbox): SandboxStatus {
  const phase = phaseFromState(sandbox.state)
  return {
    phase,
    sandboxId: sandbox.id,
    state: sandbox.state ?? null,
    error: phase === 'error' ? sandbox.errorReason || 'The sandbox reported an error.' : undefined,
    recoverable: phase === 'error' ? Boolean(sandbox.recoverable) : undefined,
    autoStopMinutes: SANDBOX_POLICY.autoStopMinutes,
  }
}

export function projectRoot(access: ProjectAccess): string {
  return access.project.daytona_workdir || `${DEFAULT_HOME_DIR}/${PROJECT_DIR_NAME}`
}

/**
 * Defense in depth: the sandbox id stored on the project row is user-writable
 * through RLS, so we never trust it alone. Labels are only settable with our
 * server API key, which lets us prove the sandbox was created for exactly this
 * project and user before any operation touches it.
 */
export function assertSandboxOwnership(sandbox: Pick<Sandbox, 'id' | 'labels'>, access: ProjectAccess) {
  const labels = sandbox.labels ?? {}
  if (labels[LABELS.project] !== access.project.id || labels[LABELS.user] !== access.userId) {
    logDaytona('warn', 'security.sandbox_label_mismatch', {
      projectId: access.project.id,
      userId: access.userId,
      sandboxId: sandbox.id,
    })
    throw new SandboxError('forbidden', 'This sandbox does not belong to the project.', 403)
  }
}

// Short-lived cache of verified, running sandboxes so file operations don't
// re-fetch sandbox metadata on every keystroke-driven save.
const verifiedCache = new Map<string, { sandbox: Sandbox; at: number }>()
const CACHE_TTL_MS = 20_000

function cacheKey(access: ProjectAccess) {
  return `${access.userId}:${access.project.id}:${access.project.daytona_sandbox_id}`
}

export function invalidateSandboxCache(access: ProjectAccess) {
  verifiedCache.delete(cacheKey(access))
}

export function clearSandboxCacheForTests() {
  verifiedCache.clear()
}

async function fetchOwnedSandbox(access: ProjectAccess, daytona: Daytona): Promise<Sandbox | null> {
  const id = access.project.daytona_sandbox_id
  if (!id) return null
  let sandbox: Sandbox
  try {
    sandbox = await daytona.get(id)
  } catch (err) {
    if (isNotFound(err)) return null
    throw toSandboxError(err, 'Could not reach the sandbox provider.')
  }
  assertSandboxOwnership(sandbox, access)
  return sandbox
}

async function persistState(access: ProjectAccess, sandbox: Sandbox) {
  if (sandbox.state && sandbox.state !== access.project.daytona_sandbox_state) {
    await access.repo.updateState(access.project.id, sandbox.id, sandbox.state).catch((err) => {
      logDaytona('warn', 'db.update_state_failed', { projectId: access.project.id, err })
    })
  }
}

async function markMissing(access: ProjectAccess, sandboxId: string): Promise<SandboxStatus> {
  logDaytona('warn', 'sandbox.missing', { projectId: access.project.id, sandboxId })
  await access.repo.clearSandbox(access.project.id, sandboxId)
  invalidateSandboxCache(access)
  return {
    phase: 'missing',
    sandboxId: null,
    state: null,
    error: 'The sandbox for this project no longer exists. Create a new one to continue.',
  }
}

export async function getSandboxStatus(access: ProjectAccess, daytona = getDaytona()): Promise<SandboxStatus> {
  const storedId = access.project.daytona_sandbox_id
  const sandbox = await fetchOwnedSandbox(access, daytona)
  if (!sandbox) {
    return storedId ? markMissing(access, storedId) : { phase: 'none', sandboxId: null, state: null }
  }
  if (phaseFromState(sandbox.state) === 'missing') return markMissing(access, sandbox.id)
  await persistState(access, sandbox)
  return statusOf(sandbox)
}

/** Bring an existing sandbox to the `started` state, waiting out transitions. */
async function startIfNeeded(sandbox: Sandbox): Promise<void> {
  const phase = phaseFromState(sandbox.state)
  try {
    if (phase === 'running') return
    if (phase === 'stopped' || phase === 'archived') {
      await sandbox.start(START_TIMEOUT_S)
    } else if (phase === 'creating' || phase === 'starting') {
      await sandbox.waitUntilStarted(START_TIMEOUT_S)
    } else if (phase === 'stopping') {
      await sandbox.waitUntilStopped(STOP_TIMEOUT_S)
      await sandbox.start(START_TIMEOUT_S)
    } else if (phase === 'error') {
      if (!sandbox.recoverable) {
        throw new SandboxError(
          'upstream',
          sandbox.errorReason || 'The sandbox is in an unrecoverable error state. Delete it and create a new one.',
          502,
        )
      }
      await sandbox.recover(START_TIMEOUT_S)
    }
  } catch (err) {
    throw toSandboxError(err, 'The sandbox failed to start.')
  }
}

async function findOrphanedSandbox(access: ProjectAccess, daytona: Daytona): Promise<Sandbox | null> {
  // Recovers from an interrupted create: the sandbox exists (labelled for this
  // project) but the DB write never happened.
  try {
    for await (const candidate of daytona.list({
      labels: { [LABELS.project]: access.project.id, [LABELS.user]: access.userId },
    })) {
      if (phaseFromState(candidate.state) !== 'missing') return candidate
    }
  } catch (err) {
    logDaytona('warn', 'sandbox.list_failed', { projectId: access.project.id, err })
  }
  return null
}

async function homeDirOf(sandbox: Sandbox): Promise<string> {
  try {
    return (await sandbox.getUserHomeDir()) || DEFAULT_HOME_DIR
  } catch {
    return DEFAULT_HOME_DIR
  }
}

export interface EnsureResult {
  status: SandboxStatus
  created: boolean
  running: RunningSandbox
}

/**
 * Reuse the project's sandbox if it exists (starting it when stopped or
 * archived), recover an orphaned one, or create a new one. Never creates a
 * second sandbox for a project that already has a live one.
 */
export async function ensureSandbox(
  access: ProjectAccess,
  { onCreated }: { onCreated?: (running: RunningSandbox) => Promise<void> } = {},
  daytona = getDaytona(),
): Promise<EnsureResult> {
  let sandbox = await fetchOwnedSandbox(access, daytona)
  if (sandbox && phaseFromState(sandbox.state) === 'missing') sandbox = null

  if (!sandbox && access.project.daytona_sandbox_id) {
    await markMissing(access, access.project.daytona_sandbox_id)
    access.project.daytona_sandbox_id = null
  }

  let created = false
  if (!sandbox) {
    const orphan = await findOrphanedSandbox(access, daytona)
    if (orphan) {
      const root = `${await homeDirOf(orphan)}/${PROJECT_DIR_NAME}`
      if (await access.repo.claimSandbox(access.project.id, orphan.id, root, orphan.state ?? 'unknown')) {
        logDaytona('info', 'sandbox.recovered_orphan', { projectId: access.project.id, sandboxId: orphan.id })
        sandbox = orphan
        access.project.daytona_sandbox_id = orphan.id
        access.project.daytona_workdir = root
      }
    }
  }

  if (!sandbox) {
    logDaytona('info', 'sandbox.create_start', { projectId: access.project.id })
    let fresh: Sandbox
    try {
      fresh = await daytona.create(
        {
          language: 'typescript',
          snapshot: SANDBOX_POLICY.snapshot,
          labels: {
            [LABELS.app]: 'coding-mode',
            [LABELS.project]: access.project.id,
            [LABELS.user]: access.userId,
          },
          public: false,
          autoStopInterval: SANDBOX_POLICY.autoStopMinutes,
          autoArchiveInterval: SANDBOX_POLICY.autoArchiveMinutes,
        },
        { timeout: CREATE_TIMEOUT_S },
      )
    } catch (err) {
      logDaytona('error', 'sandbox.create_failed', { projectId: access.project.id, err })
      throw toSandboxError(err, 'Could not create a sandbox. Please retry.')
    }

    const root = `${await homeDirOf(fresh)}/${PROJECT_DIR_NAME}`
    const claimed = await access.repo.claimSandbox(access.project.id, fresh.id, root, fresh.state ?? 'started')
    if (!claimed) {
      // Another request attached a sandbox first — discard ours and use theirs.
      logDaytona('warn', 'sandbox.create_race_lost', { projectId: access.project.id, sandboxId: fresh.id })
      await daytona.delete(fresh).catch((err) =>
        logDaytona('error', 'sandbox.race_cleanup_failed', { sandboxId: fresh.id, err }),
      )
      const reloaded = await access.repo.reload(access.project.id)
      if (!reloaded?.daytona_sandbox_id) {
        throw new SandboxError('conflict', 'Sandbox setup was interrupted. Please retry.', 409)
      }
      access.project = reloaded
      const winner = await fetchOwnedSandbox(access, daytona)
      if (!winner) throw new SandboxError('conflict', 'Sandbox setup was interrupted. Please retry.', 409)
      sandbox = winner
    } else {
      access.project.daytona_sandbox_id = fresh.id
      access.project.daytona_workdir = root
      sandbox = fresh
      created = true
      logDaytona('info', 'sandbox.created', { projectId: access.project.id, sandboxId: fresh.id })
    }
  }

  await startIfNeeded(sandbox)
  await sandbox.refreshData().catch(() => undefined)
  const root = projectRoot(access)

  const running: RunningSandbox = { sandbox, root }
  if (created) {
    try {
      await sandbox.process.executeCommand(`mkdir -p '${root.replace(/'/g, `'\\''`)}'`)
      await onCreated?.(running)
    } catch (err) {
      // Seeding is best-effort: the sandbox is usable, the user is told.
      logDaytona('error', 'sandbox.seed_failed', { projectId: access.project.id, err })
    }
  }

  await persistState(access, sandbox)
  verifiedCache.set(cacheKey(access), { sandbox, at: Date.now() })
  return { status: statusOf(sandbox), created, running }
}

/**
 * Resolve the project's sandbox for a file/terminal/process operation. It must
 * already exist and be running — we never silently create or start one here so
 * the UI stays in control of lifecycle transitions.
 */
export async function requireRunningSandbox(access: ProjectAccess, daytona = getDaytona()): Promise<RunningSandbox> {
  const key = cacheKey(access)
  const cached = verifiedCache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { sandbox: cached.sandbox, root: projectRoot(access) }
  }

  if (!access.project.daytona_sandbox_id) {
    throw new SandboxError('no_sandbox', 'This project has no sandbox yet.', 409)
  }
  const sandbox = await fetchOwnedSandbox(access, daytona)
  if (!sandbox) {
    await markMissing(access, access.project.daytona_sandbox_id)
    throw new SandboxError('sandbox_missing', 'The sandbox for this project no longer exists.', 410)
  }
  if (phaseFromState(sandbox.state) !== 'running') {
    await persistState(access, sandbox)
    throw new SandboxError('sandbox_not_running', 'The sandbox is not running. Start it to continue.', 409)
  }
  verifiedCache.set(key, { sandbox, at: Date.now() })
  return { sandbox, root: projectRoot(access) }
}

export async function stopSandbox(access: ProjectAccess, daytona = getDaytona()): Promise<SandboxStatus> {
  const sandbox = await fetchOwnedSandbox(access, daytona)
  if (!sandbox) throw new SandboxError('no_sandbox', 'This project has no sandbox.', 409)
  invalidateSandboxCache(access)
  const phase = phaseFromState(sandbox.state)
  try {
    if (phase === 'running' || phase === 'error') {
      await sandbox.stop(STOP_TIMEOUT_S)
    } else if (phase === 'starting' || phase === 'creating') {
      await sandbox.waitUntilStarted(START_TIMEOUT_S)
      await sandbox.stop(STOP_TIMEOUT_S)
    }
    await sandbox.refreshData().catch(() => undefined)
  } catch (err) {
    throw toSandboxError(err, 'The sandbox failed to stop.')
  }
  logDaytona('info', 'sandbox.stopped', { projectId: access.project.id, sandboxId: sandbox.id })
  await persistState(access, sandbox)
  return statusOf(sandbox)
}

/**
 * Permanently delete the sandbox. Only called from an explicit, confirmed user
 * action. The Zequel project row (and its saved DB files) is kept.
 */
export async function deleteSandbox(access: ProjectAccess, daytona = getDaytona()): Promise<SandboxStatus> {
  const storedId = access.project.daytona_sandbox_id
  if (!storedId) return { phase: 'none', sandboxId: null, state: null }
  const sandbox = await fetchOwnedSandbox(access, daytona)
  invalidateSandboxCache(access)
  if (sandbox) {
    try {
      await daytona.delete(sandbox, STOP_TIMEOUT_S)
    } catch (err) {
      if (!isNotFound(err)) throw toSandboxError(err, 'The sandbox could not be deleted.')
    }
  }
  await access.repo.clearSandbox(access.project.id, storedId)
  logDaytona('info', 'sandbox.deleted', { projectId: access.project.id, sandboxId: storedId })
  return { phase: 'none', sandboxId: null, state: null }
}

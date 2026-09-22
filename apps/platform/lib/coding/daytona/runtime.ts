import type { Sandbox } from '@daytona/sdk'
import { getDaytona } from './client'
import { SEED_PROJECT, SEED_PORT } from './seed'
import type { SandboxBinding } from './types'
import type {
  CodingRuntime,
  CommandResult,
  PreviewInfo,
  RuntimeFileNode,
  RuntimeProject,
  RuntimeStatus,
  ServerStatus,
  TerminalSession,
} from '../runtime'

/**
 * Server-side implementation of the shared `CodingRuntime` interface, backed by
 * a real Daytona sandbox. This class only ever runs on the server, behind the
 * API routes — the browser reaches it through `HttpCodingRuntime`.
 *
 * Execution model:
 *  - One-shot commands use `sandbox.process.executeCommand`.
 *  - The dev server runs inside a persistent Daytona *session* so it survives
 *    across stateless serverless requests; the preview URL comes from Daytona,
 *    never a hardcoded localhost.
 *  - Interactive terminals are handled by the terminal route via sessions (a
 *    full WebSocket PTY bridge is out of scope for serverless request/response
 *    and can be layered on later without changing this interface).
 */

const DEV_SESSION_ID = 'zequel-dev-server'
const DEFAULT_TIMEOUT_SEC = 60

function ok(command: string, exitCode: number, stdout: string, stderr: string): CommandResult {
  return {
    command,
    exitCode,
    stdout,
    stderr,
    ok: exitCode === 0,
  }
}

export class DaytonaCodingRuntime implements CodingRuntime {
  readonly kind = 'daytona' as const
  private _status: RuntimeStatus = 'disconnected'
  private _sandbox: Sandbox | null = null
  private readonly binding: SandboxBinding

  constructor(binding: SandboxBinding) {
    this.binding = binding
  }

  status(): RuntimeStatus {
    return this._status
  }

  /** Resolve (and cache) the live Sandbox handle for this request. */
  private async sandbox(): Promise<Sandbox> {
    if (this._sandbox) return this._sandbox
    this._status = 'connecting'
    const daytona = getDaytona()
    const sb = await daytona.get(this.binding.sandboxId)
    // Ensure it is running before we touch the filesystem / processes.
    if (sb.state && sb.state !== 'started') {
      await daytona.start(sb, DEFAULT_TIMEOUT_SEC)
      await sb.refreshData()
    }
    this._sandbox = sb
    this._status = 'ready'
    return sb
  }

  private abs(path: string): string {
    const clean = path.replace(/^\/+/, '')
    return `${this.binding.workdir}/${clean}`
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async connect(_project: RuntimeProject): Promise<RuntimeStatus> {
    await this.sandbox()
    return this._status
  }

  async destroy(): Promise<void> {
    const daytona = getDaytona()
    const sb = await daytona.get(this.binding.sandboxId)
    await daytona.delete(sb)
    this._sandbox = null
    this._status = 'disconnected'
  }

  // ── Filesystem ──────────────────────────────────────────────────────────

  async listFiles(): Promise<RuntimeFileNode[]> {
    const sb = await this.sandbox()
    // Pull a reasonably deep tree in one call; the daemon returns full paths.
    const infos = await sb.fs.listFiles(this.binding.workdir, { depth: 8 })
    const root = this.binding.workdir.replace(/\/+$/, '')

    // Build a nested tree keyed by path relative to the workdir.
    const byPath = new Map<string, RuntimeFileNode>()
    const roots: RuntimeFileNode[] = []

    // Sort so parents come before children.
    const sorted = [...infos].sort((a, b) => (a.path ?? a.name).localeCompare(b.path ?? b.name))
    for (const info of sorted) {
      const full = (info.path ?? `${root}/${info.name}`).replace(/\/+$/, '')
      const rel = full.startsWith(root) ? full.slice(root.length).replace(/^\/+/, '') : info.name
      if (!rel) continue
      const node: RuntimeFileNode = {
        path: rel,
        name: info.name,
        type: info.isDir ? 'directory' : 'file',
        ...(info.isDir ? { children: [] } : {}),
      }
      byPath.set(rel, node)
      const slash = rel.lastIndexOf('/')
      if (slash === -1) {
        roots.push(node)
      } else {
        const parent = byPath.get(rel.slice(0, slash))
        if (parent?.children) parent.children.push(node)
        else roots.push(node)
      }
    }
    return roots
  }

  async readFile(path: string): Promise<string> {
    const sb = await this.sandbox()
    const buf = await sb.fs.downloadFile(this.abs(path))
    return buf.toString('utf-8')
  }

  async writeFile(path: string, content: string): Promise<void> {
    const sb = await this.sandbox()
    await sb.fs.uploadFile(Buffer.from(content, 'utf-8'), this.abs(path))
  }

  async createFile(path: string): Promise<void> {
    const sb = await this.sandbox()
    if (path.endsWith('/')) {
      await sb.fs.createFolder(this.abs(path), '755')
      return
    }
    // Create parent dirs, then an empty file.
    const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
    if (dir) await sb.fs.createFolder(this.abs(dir), '755').catch(() => {})
    await sb.fs.uploadFile(Buffer.from('', 'utf-8'), this.abs(path))
  }

  async createFolder(path: string): Promise<void> {
    const sb = await this.sandbox()
    await sb.fs.createFolder(this.abs(path), '755')
  }

  async deleteFile(path: string): Promise<void> {
    const sb = await this.sandbox()
    await sb.fs.deleteFile(this.abs(path), true)
  }

  async renameFile(from: string, to: string): Promise<void> {
    const sb = await this.sandbox()
    await sb.fs.moveFiles(this.abs(from), this.abs(to))
  }

  // ── Execution ─────────────────────────────────────────────────────────────

  async execute(command: string): Promise<CommandResult> {
    const sb = await this.sandbox()
    try {
      const res = await sb.process.executeCommand(command, this.binding.workdir, undefined, DEFAULT_TIMEOUT_SEC)
      const stdout = res.artifacts?.stdout ?? res.result ?? ''
      return ok(command, res.exitCode ?? 0, stdout, '')
    } catch (err) {
      return {
        command,
        exitCode: null,
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Command failed',
        ok: false,
        error: err instanceof Error ? err.message : 'Command failed',
      }
    }
  }

  /**
   * Run a single terminal command line inside a persistent shell session so
   * state (cwd, env) carries across calls — the request/response terminal used
   * by the UI. Returns combined output plus exit code.
   */
  async runInSession(sessionId: string, command: string): Promise<CommandResult> {
    const sb = await this.sandbox()
    await this.ensureSession(sb, sessionId)
    try {
      const res = await sb.process.executeSessionCommand(
        sessionId,
        { command, runAsync: false },
        DEFAULT_TIMEOUT_SEC,
      )
      return ok(command, res.exitCode ?? 0, res.stdout ?? res.output ?? '', res.stderr ?? '')
    } catch (err) {
      return {
        command,
        exitCode: null,
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Command failed',
        ok: false,
        error: err instanceof Error ? err.message : 'Command failed',
      }
    }
  }

  private async ensureSession(sb: Sandbox, sessionId: string): Promise<void> {
    try {
      await sb.process.getSession(sessionId)
    } catch {
      await sb.process.createSession(sessionId)
      // Start every shell session in the project workdir.
      await sb.process
        .executeSessionCommand(sessionId, { command: `cd ${this.binding.workdir}`, runAsync: false })
        .catch(() => {})
    }
  }

  async createTerminal(): Promise<TerminalSession> {
    // Interactive PTY streaming is not modeled on the server object; the
    // terminal route drives `runInSession`. This method exists to satisfy the
    // interface and is not used server-side.
    throw new Error('Use the terminal API route (session-based execution) instead of createTerminal on the server.')
  }

  // ── Dev server / preview ────────────────────────────────────────────────

  async startServer(port = SEED_PORT): Promise<PreviewInfo> {
    const sb = await this.sandbox()
    try {
      await this.ensureSession(sb, DEV_SESSION_ID)
      // Launch the dev server asynchronously so it keeps running after the
      // request returns. `PORT` is exported for the process to bind to.
      await sb.process.executeSessionCommand(DEV_SESSION_ID, {
        command: `cd ${this.binding.workdir} && PORT=${port} npm run dev`,
        runAsync: true,
      })
      const preview = await sb.getPreviewLink(port)
      return { status: 'running', url: preview.url ?? null, port }
    } catch (err) {
      return {
        status: 'error',
        url: null,
        port,
        error: err instanceof Error ? err.message : 'Failed to start dev server',
      }
    }
  }

  async stopServer(): Promise<void> {
    const sb = await this.sandbox()
    // Killing the session terminates the dev server process tree.
    await sb.process.deleteSession(DEV_SESSION_ID).catch(() => {})
  }

  async getPreviewUrl(port = SEED_PORT): Promise<string | null> {
    const sb = await this.sandbox()
    try {
      const preview = await sb.getPreviewLink(port)
      return preview.url ?? null
    } catch {
      return null
    }
  }

  async serverStatus(port = SEED_PORT): Promise<ServerStatus> {
    const sb = await this.sandbox()
    try {
      const session = await sb.process.getSession(DEV_SESSION_ID)
      return session ? 'running' : 'stopped'
    } catch {
      return 'stopped'
    }
  }
}

/**
 * Provision a brand-new sandbox and seed it with the starter project.
 * Returns the created sandbox id and the working directory inside it.
 */
export async function provisionSandbox(input: {
  projectId: string
  name: string
}): Promise<{ sandboxId: string; workdir: string }> {
  const daytona = getDaytona()
  const sandbox = await daytona.create(
    {
      language: 'typescript',
      labels: { zequelProjectId: input.projectId, zequelProjectName: input.name },
      // Resource safety: auto-stop idle sandboxes so we never leak compute.
      autoStopInterval: 15,
      autoArchiveInterval: 60,
      autoDeleteInterval: 7 * 24 * 60,
    },
    { timeout: 120 },
  )

  const home = (await sandbox.getWorkDir()) ?? '/home/daytona'
  const workdir = `${home.replace(/\/+$/, '')}/${input.projectId}`
  await sandbox.fs.createFolder(workdir, '755')

  // Seed the real starter project files.
  for (const file of SEED_PROJECT) {
    const full = `${workdir}/${file.path}`
    const dir = full.slice(0, full.lastIndexOf('/'))
    if (dir && dir !== workdir) await sandbox.fs.createFolder(dir, '755').catch(() => {})
    await sandbox.fs.uploadFile(Buffer.from(file.content, 'utf-8'), full)
  }

  return { sandboxId: sandbox.id, workdir }
}

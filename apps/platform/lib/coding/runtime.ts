import type { CodingProject } from '@zequel/types'

/**
 * Coding Mode runtime abstraction.
 *
 * The UI depends ONLY on the `CodingRuntime` interface below — never directly
 * on any infrastructure provider. This is the seam that lets us connect a real
 * isolated cloud sandbox (e.g. Daytona) without rebuilding Coding Mode.
 *
 * Architecture (never coupled directly to Daytona in the browser):
 *
 *   Zequel frontend  ->  Zequel backend  ->  isolated sandbox  ->  Daytona
 *
 * The browser must NEVER receive privileged sandbox credentials. A concrete
 * `DaytonaCodingRuntime` lives behind server routes; every method here maps
 * to a backend call, not a direct provider call from the client.
 */

export type RuntimeStatus =
  | 'disconnected'
  | 'connecting'
  | 'ready'
  | 'error'

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'error'

// A node in the sandbox filesystem tree
export interface RuntimeFileNode {
  path: string
  name: string
  type: 'file' | 'directory'
  children?: RuntimeFileNode[]
}

// Result of a one-shot command execution inside the sandbox.
export interface CommandResult {
  command: string
  // Process exit code, or null if it never ran (e.g. no runtime).
  exitCode: number | null
  stdout: string
  stderr: string
  ok: boolean
  // Populated when the command could not be dispatched at all.
  error?: string
}

// Information about a running dev server / preview surface.
export interface PreviewInfo {
  status: ServerStatus
  // Sandbox-provided public URL. Supplied by the backend once the sandbox boots its dev server.
  url: string | null
  port: number
  error?: string
}

// A long-lived interactive terminal (PTY) session.
export interface TerminalSession {
  readonly id: string
  write(data: string): void
  onData(handler: (chunk: string) => void): () => void
  onExit(handler: (code: number | null) => void): () => void
  kill(): Promise<void>
}

// The conceptual project a runtime manages.
export interface RuntimeProject {
  id: string
  name: string
  runtime: 'mock' | 'daytona'
  sandboxId: string | null
  path: string
  createdAt: string
  updatedAt: string
}

// The full surface a coding runtime must implement.
export interface CodingRuntime {
  readonly kind: 'mock' | 'daytona'
  status(): RuntimeStatus

  // Lifecycle
  connect(project: RuntimeProject, rawProject?: CodingProject): Promise<RuntimeStatus>
  destroy(): Promise<void>

  // Filesystem
  listFiles(): Promise<RuntimeFileNode[]>
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  createFile(path: string): Promise<void>
  deleteFile(path: string): Promise<void>
  renameFile(from: string, to: string): Promise<void>

  // Execution
  execute(command: string): Promise<CommandResult>
  createTerminal(): Promise<TerminalSession>

  // Dev server / preview
  startServer(port?: number): Promise<PreviewInfo>
  stopServer(): Promise<void>
  getPreviewUrl(): Promise<string | null>
}

const NOT_CONNECTED_MESSAGE =
  'Runtime not connected. Coding Mode is not yet bound to an isolated sandbox — connect a Daytona workspace to run commands, start servers, and open previews.'

function notConnected(command: string): CommandResult {
  return {
    command,
    exitCode: null,
    stdout: '',
    stderr: NOT_CONNECTED_MESSAGE,
    ok: false,
    error: NOT_CONNECTED_MESSAGE,
  }
}

/**
 * The development adapter used when Daytona is not connected.
 */
export class NotConnectedRuntime implements CodingRuntime {
  readonly kind = 'mock' as const
  private _status: RuntimeStatus = 'disconnected'

  status(): RuntimeStatus {
    return this._status
  }

  async connect(): Promise<RuntimeStatus> {
    this._status = 'disconnected'
    return this._status
  }

  async destroy(): Promise<void> {
    this._status = 'disconnected'
  }

  async listFiles(): Promise<RuntimeFileNode[]> {
    return []
  }

  async readFile(): Promise<string> {
    throw new Error(NOT_CONNECTED_MESSAGE)
  }

  async writeFile(): Promise<void> {
    throw new Error(NOT_CONNECTED_MESSAGE)
  }

  async createFile(): Promise<void> {
    throw new Error(NOT_CONNECTED_MESSAGE)
  }

  async deleteFile(): Promise<void> {
    throw new Error(NOT_CONNECTED_MESSAGE)
  }

  async renameFile(): Promise<void> {
    throw new Error(NOT_CONNECTED_MESSAGE)
  }

  async execute(command: string): Promise<CommandResult> {
    return notConnected(command)
  }

  async createTerminal(): Promise<TerminalSession> {
    const id = crypto.randomUUID()
    const dataHandlers = new Set<(c: string) => void>()
    return {
      id,
      write: (data: string) => {
        if (data.trim()) {
          for (const h of dataHandlers) h(`\n${NOT_CONNECTED_MESSAGE}\n`)
        }
      },
      onData: (handler) => {
        dataHandlers.add(handler)
        return () => dataHandlers.delete(handler)
      },
      onExit: () => () => {},
      kill: async () => {
        dataHandlers.clear()
      },
    }
  }

  async startServer(port = 3000): Promise<PreviewInfo> {
    return {
      status: 'error',
      url: null,
      port,
      error: NOT_CONNECTED_MESSAGE,
    }
  }

  async stopServer(): Promise<void> {
    /* nothing running */
  }

  async getPreviewUrl(): Promise<string | null> {
    return null
  }
}

/**
 * The real Daytona runtime implementation routing requests through server API routes.
 */
export class DaytonaCodingRuntime implements CodingRuntime {
  readonly kind = 'daytona' as const
  private _status: RuntimeStatus = 'disconnected'
  private _project: RuntimeProject | null = null
  private _rawProject: CodingProject | null = null

  status(): RuntimeStatus {
    return this._status
  }

  async connect(project: RuntimeProject, rawProject?: CodingProject): Promise<RuntimeStatus> {
    this._project = project
    this._rawProject = rawProject || null
    this._status = 'connecting'

    try {
      const res = await fetch('/api/coding/sandbox/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', project: this._rawProject }),
      })

      if (!res.ok) {
        this._status = 'error'
        return this._status
      }

      const data = await res.json()
      if (data.status === 'ready') {
        this._status = 'ready'
        if (data.sandboxId && this._project) {
          this._project.sandboxId = data.sandboxId
        }
      } else {
        this._status = 'disconnected'
      }
    } catch {
      this._status = 'error'
    }

    return this._status
  }

  async destroy(): Promise<void> {
    if (this._rawProject) {
      try {
        await fetch('/api/coding/sandbox/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop', project: this._rawProject }),
        })
      } catch {
        /* ignore */
      }
    }
    this._status = 'disconnected'
    this._project = null
    this._rawProject = null
  }

  async listFiles(): Promise<RuntimeFileNode[]> {
    if (this._status !== 'ready' || !this._rawProject) return []
    try {
      const res = await fetch('/api/coding/sandbox/fs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listFiles', project: this._rawProject }),
      })
      const data = await res.json()
      return data.files || []
    } catch {
      return []
    }
  }

  async readFile(path: string): Promise<string> {
    if (!this._rawProject) throw new Error(NOT_CONNECTED_MESSAGE)
    const res = await fetch('/api/coding/sandbox/fs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'readFile', project: this._rawProject, path }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.content || ''
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this._rawProject) throw new Error(NOT_CONNECTED_MESSAGE)
    const res = await fetch('/api/coding/sandbox/fs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'writeFile', project: this._rawProject, path, content }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
  }

  async createFile(path: string): Promise<void> {
    if (!this._rawProject) throw new Error(NOT_CONNECTED_MESSAGE)
    const res = await fetch('/api/coding/sandbox/fs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createFile', project: this._rawProject, path }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
  }

  async deleteFile(path: string): Promise<void> {
    if (!this._rawProject) throw new Error(NOT_CONNECTED_MESSAGE)
    const res = await fetch('/api/coding/sandbox/fs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteFile', project: this._rawProject, path }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
  }

  async renameFile(from: string, to: string): Promise<void> {
    if (!this._rawProject) throw new Error(NOT_CONNECTED_MESSAGE)
    const res = await fetch('/api/coding/sandbox/fs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'renameFile', project: this._rawProject, from, to }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
  }

  async execute(command: string): Promise<CommandResult> {
    if (!this._rawProject) return notConnected(command)
    try {
      const res = await fetch('/api/coding/sandbox/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', project: this._rawProject, command }),
      })
      const data = await res.json()
      return data as CommandResult
    } catch (err) {
      return {
        command,
        exitCode: 1,
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution request failed',
        ok: false,
      }
    }
  }

  async createTerminal(): Promise<TerminalSession> {
    const id = crypto.randomUUID()
    const dataHandlers = new Set<(c: string) => void>()

    return {
      id,
      write: (data: string) => {
        if (!data.trim()) return
        void (async () => {
          const result = await this.execute(data.trim())
          const output = result.stdout || result.stderr || (result.ok ? '' : result.error || 'Execution failed')
          for (const h of dataHandlers) {
            h(`\n$ ${data.trim()}\n${output}\n`)
          }
        })()
      },
      onData: (handler) => {
        dataHandlers.add(handler)
        return () => dataHandlers.delete(handler)
      },
      onExit: () => () => {},
      kill: async () => {
        dataHandlers.clear()
      },
    }
  }

  async startServer(port = 3000): Promise<PreviewInfo> {
    if (!this._rawProject) {
      return { status: 'error', url: null, port, error: NOT_CONNECTED_MESSAGE }
    }
    try {
      const res = await fetch('/api/coding/sandbox/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startServer', project: this._rawProject, port }),
      })
      const data = await res.json()
      return data as PreviewInfo
    } catch (err) {
      return {
        status: 'error',
        url: null,
        port,
        error: err instanceof Error ? err.message : 'Server start failed',
      }
    }
  }

  async stopServer(): Promise<void> {
    if (!this._rawProject) return
    try {
      await fetch('/api/coding/sandbox/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stopServer', project: this._rawProject }),
      })
    } catch {
      /* ignore */
    }
  }

  async getPreviewUrl(): Promise<string | null> {
    if (!this._rawProject) return null
    try {
      const res = await fetch('/api/coding/sandbox/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getPreviewUrl', project: this._rawProject }),
      })
      const data = await res.json()
      return data.url || null
    } catch {
      return null
    }
  }
}

// Map a DB project row onto the runtime project shape.
export function toRuntimeProject(project: CodingProject): RuntimeProject {
  return {
    id: project.id,
    name: project.name,
    runtime: project.daytona_sandbox_id ? 'daytona' : 'mock',
    sandboxId: project.daytona_sandbox_id || null,
    path: `/workspace/${project.id}`,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  }
}

// Factory to instantiate runtime adapter.
export function createCodingRuntime(kind: 'mock' | 'daytona' = 'daytona'): CodingRuntime {
  if (kind === 'daytona') {
    return new DaytonaCodingRuntime()
  }
  return new NotConnectedRuntime()
}

export const RUNTIME_NOT_CONNECTED_MESSAGE = NOT_CONNECTED_MESSAGE

import type { CodingProject } from '@zequel/types'

/**
 * Coding Mode runtime abstraction.
 *
 * The UI depends ONLY on the `CodingRuntime` interface below — never directly
 * on any infrastructure provider. This is the seam that lets us connect a real
 * isolated cloud sandbox (e.g. Daytona) later without rebuilding Coding Mode.
 *
 * Architecture (never coupled directly to Daytona in the browser):
 *
 *   Zequel frontend  ->  Zequel backend  ->  isolated sandbox  ->  Daytona
 *
 * The browser must NEVER receive privileged sandbox credentials. A concrete
 * `DaytonaCodingRuntime` will live behind server routes; every method here maps
 * to a backend call, not a direct provider call from the client.
 *
 * Until that backend exists, `NotConnectedRuntime` is the active adapter. It
 * does not fake execution — every operation that needs a live sandbox reports a
 * clear "not connected" result so the UI can render honest loading/error state.
 */

export type RuntimeStatus =
  | 'disconnected'
  | 'connecting'
  | 'ready'
  | 'error'

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'error'

// A node in the sandbox filesystem tree (distinct from the DB-backed CodingFile
// model — this is what a real sandbox FS API will return).
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
  // Sandbox-provided public URL. Never a hardcoded localhost — this is supplied
  // by the backend once the sandbox boots its dev server.
  url: string | null
  port: number
  error?: string
}

// A long-lived interactive terminal (PTY) session. The custom terminal UI and a
// future xterm.js renderer both drive the exact same interface.
export interface TerminalSession {
  readonly id: string
  // Send raw input (a command + newline, a keystroke, a Ctrl-C, etc.).
  write(data: string): void
  // Subscribe to output streamed back from the PTY. Returns an unsubscribe fn.
  onData(handler: (chunk: string) => void): () => void
  // Notified when the underlying session exits.
  onExit(handler: (code: number | null) => void): () => void
  kill(): Promise<void>
}

// The conceptual project a runtime manages. Richer than the DB `CodingProject`
// row: it also carries the sandbox binding the backend will populate.
export interface RuntimeProject {
  id: string
  name: string
  // Which runtime backs this project (mock today, daytona later).
  runtime: 'mock' | 'daytona'
  // Sandbox identifier assigned by the backend once provisioned.
  sandboxId: string | null
  // Working directory / repository path inside the sandbox.
  path: string
  createdAt: string
  updatedAt: string
}

// The full surface a coding runtime must implement. Each method is also the
// tool surface the AI coding assistant will call (listFiles, readFile,
// writeFile, execute, startServer, ...).
export interface CodingRuntime {
  readonly kind: 'mock' | 'daytona'
  status(): RuntimeStatus

  // Lifecycle
  connect(project: RuntimeProject): Promise<RuntimeStatus>
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
 * The development adapter used until a real sandbox backend is wired up.
 *
 * It is deliberately honest: it never pretends a command ran or a server
 * started. Anything requiring a live sandbox resolves to a not-connected
 * result, letting the UI show correct empty/error states instead of fabricated
 * output. Swap this for `DaytonaCodingRuntime` behind the same interface.
 */
export class NotConnectedRuntime implements CodingRuntime {
  readonly kind = 'mock' as const
  private _status: RuntimeStatus = 'disconnected'
  private _project: RuntimeProject | null = null

  status(): RuntimeStatus {
    return this._status
  }

  async connect(project: RuntimeProject): Promise<RuntimeStatus> {
    // A real adapter would provision/attach a sandbox here. With no backend we
    // remain honestly disconnected rather than reporting a phantom "ready".
    this._project = project
    this._status = 'disconnected'
    return this._status
  }

  async destroy(): Promise<void> {
    this._project = null
    this._status = 'disconnected'
  }

  async listFiles(): Promise<RuntimeFileNode[]> {
    // Files live in the DB-backed store today; the sandbox FS is empty until
    // connected.
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
    // Return an inert session that immediately reports the not-connected state
    // rather than swallowing input silently.
    const id = crypto.randomUUID()
    const dataHandlers = new Set<(c: string) => void>()
    return {
      id,
      write: (data: string) => {
        // Echo a clear notice for any submitted command line.
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

// Map a DB project row onto the richer runtime project shape.
export function toRuntimeProject(project: CodingProject): RuntimeProject {
  return {
    id: project.id,
    name: project.name,
    runtime: 'mock',
    sandboxId: null,
    path: `/workspace/${project.id}`,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  }
}

// Factory. When the Daytona backend lands, this is the single place that
// decides which concrete runtime to instantiate.
export function createCodingRuntime(): CodingRuntime {
  return new NotConnectedRuntime()
}

export const RUNTIME_NOT_CONNECTED_MESSAGE = NOT_CONNECTED_MESSAGE

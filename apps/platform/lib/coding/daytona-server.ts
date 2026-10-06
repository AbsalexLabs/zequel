import { Daytona, type Sandbox } from '@daytona/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CodingFile, CodingFolder, CodingProject } from '@zequel/types'
import type { CommandResult, PreviewInfo, RuntimeFileNode } from './runtime'

export interface DaytonaServerConfig {
  apiKey?: string
  apiUrl?: string
  target?: string
}

let cachedClient: Daytona | null = null

export function sanitizePath(inputPath: string): string {
  if (!inputPath) return '.'
  const normalized = inputPath.replace(/\\/g, '/').replace(/\0/g, '')
  // Remove shell metacharacters to prevent command injection
  return normalized.replace(/['"`$;|&<>]/g, '')
}

export function getDaytonaClient(): Daytona | null {
  const apiKey = process.env.DAYTONA_API_KEY
  if (!apiKey) {
    return null
  }

  if (!cachedClient) {
    cachedClient = new Daytona({
      apiKey,
      apiUrl: process.env.DAYTONA_API_URL,
      target: process.env.DAYTONA_TARGET,
    })
  }

  return cachedClient
}

export function isDaytonaConfigured(): boolean {
  return Boolean(process.env.DAYTONA_API_KEY)
}

/**
 * Gets or provisions an active Daytona sandbox for the given coding project.
 */
export async function getOrCreateSandboxForProject(
  supabase: SupabaseClient,
  userId: string,
  project: CodingProject
): Promise<{ sandbox: Sandbox | null; error?: string }> {
  const daytona = getDaytonaClient()
  if (!daytona) {
    return {
      sandbox: null,
      error: 'Daytona API Key (DAYTONA_API_KEY) is not configured in environment variables.',
    }
  }

  try {
    let sandbox: Sandbox | null = null

    if (project.daytona_sandbox_id) {
      try {
        sandbox = await daytona.get(project.daytona_sandbox_id)
        if (sandbox && sandbox.state === 'stopped') {
          await daytona.start(sandbox)
        }
      } catch (err) {
        console.warn('[Daytona] Existing sandbox lookup failed, creating a new sandbox:', err)
        sandbox = null
      }
    }

    if (!sandbox) {
      sandbox = await daytona.create({
        language: 'typescript',
        labels: {
          projectId: project.id,
          userId,
        },
      })

      await supabase
        .from('coding_projects')
        .update({
          daytona_sandbox_id: sandbox.id,
          daytona_sandbox_state: sandbox.state,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)
        .eq('user_id', userId)
    }

    return { sandbox }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to Daytona sandbox'
    console.error('[Daytona] Error creating/retrieving sandbox:', err)
    return { sandbox: null, error: msg }
  }
}

/**
 * Syncs DB-backed project files and folders into the Daytona sandbox filesystem.
 */
export async function syncProjectToSandbox(
  supabase: SupabaseClient,
  userId: string,
  project: CodingProject,
  sandbox: Sandbox
): Promise<{ success: boolean; error?: string }> {
  try {
    const [{ data: folders }, { data: files }] = await Promise.all([
      supabase
        .from('coding_folders')
        .select('*')
        .eq('project_id', project.id)
        .eq('user_id', userId),
      supabase
        .from('coding_files')
        .select('*')
        .eq('project_id', project.id)
        .eq('user_id', userId),
    ])

    const folderList = (folders as CodingFolder[]) ?? []
    const fileList = (files as CodingFile[]) ?? []

    const folderPathMap = new Map<string, string>()

    const resolvedFolders = [...folderList].sort((a, b) => {
      const depthA = a.parent_id ? 1 : 0
      const depthB = b.parent_id ? 1 : 0
      return depthA - depthB
    })

    for (const folder of resolvedFolders) {
      const parentPath = folder.parent_id ? folderPathMap.get(folder.parent_id) ?? '' : ''
      const rawFullPath = parentPath ? `${parentPath}/${folder.name}` : folder.name
      const safeFullPath = sanitizePath(rawFullPath)
      folderPathMap.set(folder.id, safeFullPath)

      // Safe creation via fs API / sanitized folder path
      await sandbox.fs.uploadFile(Buffer.from(''), `${safeFullPath}/.gitkeep`)
    }

    for (const file of fileList) {
      const folderPath = file.folder_id ? folderPathMap.get(file.folder_id) ?? '' : ''
      const rawRelativePath = folderPath ? `${folderPath}/${file.name}` : file.name
      const safePath = sanitizePath(rawRelativePath)

      if (file.kind === 'text') {
        await sandbox.fs.uploadFile(Buffer.from(file.content || ''), safePath)
      }
    }

    await supabase
      .from('coding_projects')
      .update({
        daytona_last_synced_at: new Date().toISOString(),
      })
      .eq('id', project.id)
      .eq('user_id', userId)

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to sync project files to Daytona'
    console.error('[Daytona] File sync failed:', err)
    return { success: false, error: msg }
  }
}

/**
 * Helper to build nested `RuntimeFileNode[]` from Daytona `FileInfo[]`.
 */
export function buildFileTree(files: Array<{ name: string; path?: string; isDir?: boolean }>): RuntimeFileNode[] {
  const tree: RuntimeFileNode[] = []

  for (const file of files) {
    const isDir = Boolean(file.isDir)
    const filePath = file.path || file.name

    tree.push({
      path: filePath,
      name: file.name,
      type: isDir ? 'directory' : 'file',
    })
  }

  return tree
}

/**
 * Executes a command in the Daytona sandbox.
 */
export async function executeCommandInSandbox(
  sandbox: Sandbox,
  command: string
): Promise<CommandResult> {
  try {
    const response = await sandbox.process.executeCommand(command)
    const stdout = response.result ?? ''
    const ok = response.exitCode === 0

    return {
      command,
      exitCode: response.exitCode ?? 0,
      stdout,
      stderr: '',
      ok,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Execution failed'
    return {
      command,
      exitCode: 1,
      stdout: '',
      stderr: errorMsg,
      ok: false,
      error: errorMsg,
    }
  }
}

/**
 * Obtains preview Info for a port in the Daytona sandbox.
 */
export async function getSandboxPreviewUrl(
  sandbox: Sandbox,
  port: number = 3000
): Promise<PreviewInfo> {
  try {
    const signedPreview = await sandbox.getSignedPreviewUrl(port)
    return {
      status: 'running',
      url: signedPreview.url,
      port,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Could not generate preview URL'
    return {
      status: 'error',
      url: null,
      port,
      error: errorMsg,
    }
  }
}

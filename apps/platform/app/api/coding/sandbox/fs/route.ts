import { NextResponse } from 'next/server'
import { createClient } from '@zequel/shared/supabase/server'
import {
  getOrCreateSandboxForProject,
  isDaytonaConfigured,
  buildFileTree,
  sanitizePath,
} from '@/lib/coding/daytona-server'
import type { CodingProject } from '@zequel/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDaytonaConfigured()) {
      return NextResponse.json(
        { error: 'Daytona API Key not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { action, project, path, content, from, to } = body as {
      action: 'listFiles' | 'readFile' | 'writeFile' | 'createFile' | 'deleteFile' | 'renameFile'
      project: CodingProject
      path?: string
      content?: string
      from?: string
      to?: string
    }

    if (!project || !project.id) {
      return NextResponse.json({ error: 'Project payload required' }, { status: 400 })
    }

    const { sandbox, error } = await getOrCreateSandboxForProject(
      supabase,
      user.id,
      project
    )

    if (error || !sandbox) {
      return NextResponse.json(
        { error: error || 'Sandbox unavailable' },
        { status: 500 }
      )
    }

    const targetPath = sanitizePath(path || '.')

    if (action === 'listFiles') {
      try {
        const fileInfos = await sandbox.fs.listFiles(targetPath, { depth: 5 })
        const tree = buildFileTree(
          fileInfos.map((f) => ({
            name: f.name,
            path: f.path || f.name,
            isDir: f.isDir,
          }))
        )
        return NextResponse.json({ files: tree })
      } catch (err) {
        return NextResponse.json({ files: [] })
      }
    }

    if (action === 'readFile') {
      if (!path) {
        return NextResponse.json({ error: 'Path required' }, { status: 400 })
      }
      const buffer = await sandbox.fs.downloadFile(targetPath)
      const text = buffer ? buffer.toString('utf-8') : ''
      return NextResponse.json({ content: text })
    }

    if (action === 'writeFile') {
      if (!path) {
        return NextResponse.json({ error: 'Path required' }, { status: 400 })
      }
      await sandbox.fs.uploadFile(Buffer.from(content || ''), targetPath)
      return NextResponse.json({ success: true })
    }

    if (action === 'createFile') {
      if (!path) {
        return NextResponse.json({ error: 'Path required' }, { status: 400 })
      }
      await sandbox.fs.uploadFile(Buffer.from(''), targetPath)
      return NextResponse.json({ success: true })
    }

    if (action === 'deleteFile') {
      if (!path) {
        return NextResponse.json({ error: 'Path required' }, { status: 400 })
      }
      await sandbox.process.executeCommand(`rm -rf '${targetPath}'`)
      return NextResponse.json({ success: true })
    }

    if (action === 'renameFile') {
      if (!from || !to) {
        return NextResponse.json({ error: 'Source (from) and target (to) paths required' }, { status: 400 })
      }
      const safeFrom = sanitizePath(from)
      const safeTo = sanitizePath(to)
      await sandbox.fs.moveFiles(safeFrom, safeTo)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[Daytona API FS Error]:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'FileSystem action failed' },
      { status: 500 }
    )
  }
}

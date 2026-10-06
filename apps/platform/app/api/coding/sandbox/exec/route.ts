import { NextResponse } from 'next/server'
import { createClient } from '@zequel/shared/supabase/server'
import {
  getOrCreateSandboxForProject,
  isDaytonaConfigured,
  executeCommandInSandbox,
  getSandboxPreviewUrl,
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
    const { action, project, command, port } = body as {
      action: 'execute' | 'startServer' | 'stopServer' | 'getPreviewUrl'
      project: CodingProject
      command?: string
      port?: number
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

    const targetPort = port || 3000

    if (action === 'execute') {
      if (!command) {
        return NextResponse.json({ error: 'Command required' }, { status: 400 })
      }
      const result = await executeCommandInSandbox(sandbox, command)
      return NextResponse.json(result)
    }

    if (action === 'startServer') {
      const runCmd = command || `pnpm dev --port ${targetPort} &`
      void sandbox.process.executeCommand(runCmd)

      const previewInfo = await getSandboxPreviewUrl(sandbox, targetPort)
      return NextResponse.json(previewInfo)
    }

    if (action === 'stopServer') {
      await sandbox.process.executeCommand(`fuser -k ${targetPort}/tcp || true`)
      return NextResponse.json({ success: true })
    }

    if (action === 'getPreviewUrl') {
      const previewInfo = await getSandboxPreviewUrl(sandbox, targetPort)
      return NextResponse.json({ url: previewInfo.url })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[Daytona API Exec Error]:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Execution action failed' },
      { status: 500 }
    )
  }
}

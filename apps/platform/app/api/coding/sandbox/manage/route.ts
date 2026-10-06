import { NextResponse } from 'next/server'
import { createClient } from '@zequel/shared/supabase/server'
import {
  getDaytonaClient,
  getOrCreateSandboxForProject,
  isDaytonaConfigured,
  syncProjectToSandbox,
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

    const body = await request.json()
    const { action, project } = body as {
      action: 'connect' | 'status' | 'stop' | 'delete'
      project?: CodingProject
    }

    if (!isDaytonaConfigured()) {
      return NextResponse.json({
        configured: false,
        status: 'disconnected',
        message: 'Daytona API Key (DAYTONA_API_KEY) is not configured in environment.',
      })
    }

    if (action === 'status') {
      return NextResponse.json({
        configured: true,
        status: 'ready',
      })
    }

    if (!project || !project.id) {
      return NextResponse.json({ error: 'Project payload required' }, { status: 400 })
    }

    const daytona = getDaytonaClient()
    if (!daytona) {
      return NextResponse.json(
        { error: 'Daytona client unavailable' },
        { status: 503 }
      )
    }

    if (action === 'connect') {
      const { sandbox, error } = await getOrCreateSandboxForProject(
        supabase,
        user.id,
        project
      )

      if (error || !sandbox) {
        return NextResponse.json(
          { error: error || 'Failed to provision Daytona sandbox' },
          { status: 500 }
        )
      }

      // Sync workspace files
      const syncResult = await syncProjectToSandbox(
        supabase,
        user.id,
        project,
        sandbox
      )

      if (!syncResult.success) {
        console.warn('[Daytona API] Sync issue:', syncResult.error)
      }

      return NextResponse.json({
        configured: true,
        status: 'ready',
        sandboxId: sandbox.id,
        sandboxState: sandbox.state,
        synced: syncResult.success,
      })
    }

    if (action === 'stop' && project.daytona_sandbox_id) {
      try {
        const sandbox = await daytona.get(project.daytona_sandbox_id)
        if (sandbox) {
          await daytona.stop(sandbox)
          await supabase
            .from('coding_projects')
            .update({ daytona_sandbox_state: 'stopped' })
            .eq('id', project.id)
            .eq('user_id', user.id)
        }
      } catch (err) {
        console.warn('[Daytona API] Stop error:', err)
      }

      return NextResponse.json({ status: 'stopped' })
    }

    if (action === 'delete' && project.daytona_sandbox_id) {
      try {
        const sandbox = await daytona.get(project.daytona_sandbox_id)
        if (sandbox) {
          await daytona.delete(sandbox)
          await supabase
            .from('coding_projects')
            .update({ daytona_sandbox_id: null, daytona_sandbox_state: null })
            .eq('id', project.id)
            .eq('user_id', user.id)
        }
      } catch (err) {
        console.warn('[Daytona API] Delete error:', err)
      }

      return NextResponse.json({ status: 'deleted' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[Daytona API Manage Error]:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Manage request failed' },
      { status: 500 }
    )
  }
}

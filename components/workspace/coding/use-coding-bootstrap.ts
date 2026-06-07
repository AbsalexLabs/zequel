'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { getLanguageMeta } from '@/lib/coding/languages'
import type { CodingFile, CodingProject, CodingMessage } from '@/lib/types'

/**
 * Loads (or lazily creates) the user's default coding project the first time
 * Coding Mode is opened, then hydrates files and chat history into the store.
 * Subsequent mode switches reuse the already-loaded project.
 */
export function useCodingBootstrap(active: boolean) {
  const {
    codingProject,
    setCodingProject,
    setCodingFiles,
    setActiveCodingFileId,
    setCodingMessages,
  } = useWorkspaceStore()

  const loadingRef = useRef(false)

  useEffect(() => {
    if (!active || codingProject || loadingRef.current) return
    loadingRef.current = true

    const load = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        loadingRef.current = false
        return
      }

      // Find the most recent project, or create a starter one.
      const { data: projects } = await supabase
        .from('coding_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      let project = projects?.[0] as CodingProject | undefined

      if (!project) {
        const { data: created } = await supabase
          .from('coding_projects')
          .insert({ user_id: user.id, name: 'My First Project' })
          .select()
          .single()
        project = created as CodingProject | undefined

        // Seed a starter file so the editor isn't empty.
        if (project) {
          const meta = getLanguageMeta('javascript')
          await supabase.from('coding_files').insert({
            project_id: project.id,
            user_id: user.id,
            name: `main.${meta.extension}`,
            language: meta.id,
            content: meta.starter,
          })
        }
      }

      if (!project) {
        loadingRef.current = false
        return
      }

      setCodingProject(project)

      const [{ data: files }, { data: messages }] = await Promise.all([
        supabase
          .from('coding_files')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('coding_messages')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: true }),
      ])

      const fileList = (files as CodingFile[]) ?? []
      setCodingFiles(fileList)
      if (fileList.length > 0) setActiveCodingFileId(fileList[0].id)
      setCodingMessages((messages as CodingMessage[]) ?? [])

      loadingRef.current = false
    }

    void load()
  }, [
    active,
    codingProject,
    setCodingProject,
    setCodingFiles,
    setActiveCodingFileId,
    setCodingMessages,
  ])
}

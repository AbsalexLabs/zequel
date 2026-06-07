'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { CODING_LANGUAGES, getLanguageMeta, languageFromFileName } from '@/lib/coding/languages'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FilePlus,
  FileCode,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import type { CodingFile, CodingLanguage } from '@/lib/types'

export function CodingFilesPanel({ hideHeader }: { hideHeader?: boolean }) {
  const {
    codingProject,
    codingFiles,
    addCodingFile,
    updateCodingFile,
    removeCodingFile,
    activeCodingFileId,
    setActiveCodingFileId,
  } = useWorkspaceStore()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLang, setNewLang] = useState<CodingLanguage>('javascript')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [busy, setBusy] = useState(false)

  const handleCreate = async () => {
    if (!codingProject || busy) return
    const meta = getLanguageMeta(newLang)
    const trimmed = newName.trim()
    const name = trimmed
      ? trimmed.includes('.')
        ? trimmed
        : `${trimmed}.${meta.extension}`
      : `untitled.${meta.extension}`
    // Match language to the final extension when the user typed one.
    const language = trimmed.includes('.') ? languageFromFileName(name) : newLang

    setBusy(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setBusy(false)
      return
    }

    const { data, error } = await supabase
      .from('coding_files')
      .insert({
        project_id: codingProject.id,
        user_id: user.id,
        name,
        language,
        content: getLanguageMeta(language).starter,
      })
      .select()
      .single()

    if (data && !error) {
      addCodingFile(data as CodingFile)
      setActiveCodingFileId((data as CodingFile).id)
    }
    setNewName('')
    setNewLang('javascript')
    setCreating(false)
    setBusy(false)
  }

  const handleRename = async (file: CodingFile) => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === file.name) {
      setRenamingId(null)
      return
    }
    const name = trimmed
    const language = languageFromFileName(name)
    updateCodingFile(file.id, { name, language })
    setRenamingId(null)

    const supabase = createClient()
    await supabase.from('coding_files').update({ name, language }).eq('id', file.id)
  }

  const handleDelete = async (file: CodingFile) => {
    removeCodingFile(file.id)
    const supabase = createClient()
    await supabase.from('coding_files').delete().eq('id', file.id)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {!hideHeader && (
        <div className="flex shrink-0 items-center justify-between px-4 py-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
            Project Files
          </span>
          <button
            onClick={() => setCreating((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Create file"
          >
            <FilePlus className="h-4 w-4" />
          </button>
        </div>
      )}

      {codingProject && (
        <div className="px-4 pb-2">
          <span className="font-sans text-xs text-muted-foreground">
            {codingProject.name}
          </span>
        </div>
      )}

      {/* New file form */}
      {creating && (
        <div className="mx-3 mb-2 flex flex-col gap-2 rounded-md border border-border bg-secondary/30 p-2.5">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setCreating(false)
            }}
            placeholder="filename"
            className="h-8 font-mono text-xs"
          />
          <div className="flex items-center gap-2">
            <select
              value={newLang}
              onChange={(e) => setNewLang(e.target.value as CodingLanguage)}
              className="h-8 flex-1 rounded-md border border-border bg-background px-2 font-mono text-[11px] text-foreground"
            >
              {CODING_LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={busy}
              className="h-8 bg-foreground font-mono text-[10px] uppercase tracking-wider text-background hover:bg-foreground/90"
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {codingFiles.length === 0 ? (
          <p className="px-2 py-4 font-sans text-xs text-muted-foreground">
            No files yet. Create one to start coding.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {codingFiles.map((file) => {
              const isActive = file.id === activeCodingFileId
              const isRenaming = file.id === renamingId
              return (
                <li key={file.id}>
                  {isRenaming ? (
                    <div className="flex items-center gap-1 px-1 py-1">
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(file)
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        className="h-7 font-mono text-xs"
                      />
                      <button
                        onClick={() => handleRename(file)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                        aria-label="Confirm rename"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                        aria-label="Cancel rename"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                        isActive
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      )}
                    >
                      <button
                        onClick={() => setActiveCodingFileId(file.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <FileCode className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate font-mono text-xs">{file.name}</span>
                      </button>
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                        {getLanguageMeta(file.language).extension}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                            aria-label="File actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => {
                              setRenamingId(file.id)
                              setRenameValue(file.name)
                            }}
                            className="gap-2 font-sans text-xs"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(file)}
                            className="gap-2 font-sans text-xs text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

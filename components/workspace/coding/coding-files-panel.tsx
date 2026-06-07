'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { useLoadCodingProject } from './use-coding-bootstrap'
import {
  CODING_LANGUAGES,
  getLanguageMeta,
  languageFromFileName,
} from '@/lib/coding/languages'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FilePlus,
  FolderPlus,
  FileCode,
  Folder,
  FolderOpen,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Box,
  Settings,
} from 'lucide-react'
import type {
  CodingFile,
  CodingFolder,
  CodingLanguage,
  CodingProject,
  Profile,
} from '@/lib/types'

type CreateTarget = { kind: 'file' | 'folder'; parentId: string | null } | null

function getDisplayName(profile?: Profile | null, userEmail?: string) {
  if (profile?.full_name) return profile.full_name
  if (profile?.display_name) return profile.display_name
  if (profile?.username) return `@${profile.username}`
  return userEmail || 'Account'
}

function getInitials(profile?: Profile | null, userEmail?: string) {
  const name = profile?.full_name || profile?.display_name || userEmail || 'U'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function CodingFilesPanel({
  hideHeader,
  userEmail,
  profile,
}: {
  hideHeader?: boolean
  userEmail?: string
  profile?: Profile | null
}) {
  const {
    codingProjects,
    codingProject,
    addCodingProject,
    updateCodingProject,
    removeCodingProject,
    setCodingProject,
    setCodingProjects,
    codingFolders,
    addCodingFolder,
    updateCodingFolder,
    removeCodingFolder,
    expandedFolderIds,
    toggleFolderExpanded,
    codingFiles,
    addCodingFile,
    updateCodingFile,
    removeCodingFile,
    activeCodingFileId,
    setActiveCodingFileId,
  } = useWorkspaceStore()

  const loadProject = useLoadCodingProject()

  const [createTarget, setCreateTarget] = useState<CreateTarget>(null)
  const [newName, setNewName] = useState('')
  const [newLang, setNewLang] = useState<CodingLanguage>('javascript')
  const [renaming, setRenaming] = useState<{ type: 'file' | 'folder'; id: string } | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [busy, setBusy] = useState(false)

  const getUser = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }

  // ─── Projects ──────────────────────────────────────────────────────────
  const handleCreateProject = async () => {
    if (busy) return
    const name = projectName.trim() || 'Untitled Project'
    setBusy(true)
    const user = await getUser()
    if (!user) return setBusy(false)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coding_projects')
      .insert({ user_id: user.id, name })
      .select()
      .single()
    if (data && !error) {
      addCodingProject(data as CodingProject)
      await loadProject(data as CodingProject)
    }
    setProjectName('')
    setCreatingProject(false)
    setBusy(false)
  }

  const handleSwitchProject = async (project: CodingProject) => {
    if (project.id === codingProject?.id) return
    await loadProject(project)
  }

  const handleDeleteProject = async (project: CodingProject) => {
    const supabase = createClient()
    removeCodingProject(project.id)
    await supabase.from('coding_projects').delete().eq('id', project.id)
    // If the active project was deleted, switch to another or clear.
    if (project.id === codingProject?.id) {
      const remaining = codingProjects.filter((p) => p.id !== project.id)
      if (remaining[0]) await loadProject(remaining[0])
      else {
        setCodingProject(null)
        setCodingProjects([])
      }
    }
  }

  // ─── Folders ───────────────────────────────────────────────────────────
  const handleCreateFolder = async (parentId: string | null) => {
    if (!codingProject || busy) return
    const name = newName.trim() || 'new-folder'
    setBusy(true)
    const user = await getUser()
    if (!user) return setBusy(false)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coding_folders')
      .insert({
        project_id: codingProject.id,
        user_id: user.id,
        parent_id: parentId,
        name,
      })
      .select()
      .single()
    if (data && !error) addCodingFolder(data as CodingFolder)
    resetCreate()
    setBusy(false)
  }

  // ─── Files ─────────────────────────────────────────────────────────────
  const handleCreateFile = async (parentId: string | null) => {
    if (!codingProject || busy) return
    const meta = getLanguageMeta(newLang)
    const trimmed = newName.trim()
    const name = trimmed
      ? trimmed.includes('.')
        ? trimmed
        : `${trimmed}.${meta.extension}`
      : `untitled.${meta.extension}`
    const language = trimmed.includes('.') ? languageFromFileName(name) : newLang

    setBusy(true)
    const user = await getUser()
    if (!user) return setBusy(false)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coding_files')
      .insert({
        project_id: codingProject.id,
        user_id: user.id,
        folder_id: parentId,
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
    resetCreate()
    setBusy(false)
  }

  const resetCreate = () => {
    setNewName('')
    setNewLang('javascript')
    setCreateTarget(null)
  }

  const submitCreate = () => {
    if (!createTarget) return
    if (createTarget.kind === 'folder') void handleCreateFolder(createTarget.parentId)
    else void handleCreateFile(createTarget.parentId)
  }

  // ─── Rename / Delete ─────────────────────────────────────────────────────
  const handleRenameFile = async (file: CodingFile) => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === file.name) return setRenaming(null)
    const language = languageFromFileName(trimmed)
    updateCodingFile(file.id, { name: trimmed, language })
    setRenaming(null)
    const supabase = createClient()
    await supabase
      .from('coding_files')
      .update({ name: trimmed, language })
      .eq('id', file.id)
  }

  const handleRenameFolder = async (folder: CodingFolder) => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === folder.name) return setRenaming(null)
    updateCodingFolder(folder.id, { name: trimmed })
    setRenaming(null)
    const supabase = createClient()
    await supabase.from('coding_folders').update({ name: trimmed }).eq('id', folder.id)
  }

  const handleDeleteFile = async (file: CodingFile) => {
    removeCodingFile(file.id)
    const supabase = createClient()
    await supabase.from('coding_files').delete().eq('id', file.id)
  }

  const handleDeleteFolder = async (folder: CodingFolder) => {
    removeCodingFolder(folder.id)
    const supabase = createClient()
    // DB cascade removes descendant folders + files automatically.
    await supabase.from('coding_folders').delete().eq('id', folder.id)
  }

  // ─── Derived tree structures ─────────────────────────────────────────────
  const foldersByParent = useMemo(() => {
    const map = new Map<string | null, CodingFolder[]>()
    for (const f of codingFolders) {
      const key = f.parent_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return map
  }, [codingFolders])

  const filesByFolder = useMemo(() => {
    const map = new Map<string | null, CodingFile[]>()
    for (const f of codingFiles) {
      const key = f.folder_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return map
  }, [codingFiles])

  const startRename = (type: 'file' | 'folder', id: string, current: string) => {
    setRenaming({ type, id })
    setRenameValue(current)
  }

  // Recursive renderer for a folder's children (subfolders then files).
  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const subfolders = foldersByParent.get(parentId) ?? []
    const files = filesByFolder.get(parentId) ?? []
    const indent = { paddingLeft: `${depth * 12 + 8}px` }

    return (
      <>
        {subfolders.map((folder) => {
          const expanded = expandedFolderIds.includes(folder.id)
          const isRenaming = renaming?.type === 'folder' && renaming.id === folder.id
          return (
            <li key={folder.id}>
              {isRenaming ? (
                <RenameRow
                  style={indent}
                  value={renameValue}
                  onChange={setRenameValue}
                  onConfirm={() => handleRenameFolder(folder)}
                  onCancel={() => setRenaming(null)}
                />
              ) : (
                <div
                  className="group flex items-center gap-1 rounded-md py-1.5 pr-1 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                  style={indent}
                >
                  <button
                    onClick={() => toggleFolderExpanded(folder.id)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  >
                    {expanded ? (
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    )}
                    {expanded ? (
                      <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Folder className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate font-mono text-xs">{folder.name}</span>
                  </button>
                  <FolderMenu
                    onNewFile={() => {
                      setCreateTarget({ kind: 'file', parentId: folder.id })
                      if (!expanded) toggleFolderExpanded(folder.id)
                    }}
                    onNewFolder={() => {
                      setCreateTarget({ kind: 'folder', parentId: folder.id })
                      if (!expanded) toggleFolderExpanded(folder.id)
                    }}
                    onRename={() => startRename('folder', folder.id, folder.name)}
                    onDelete={() => handleDeleteFolder(folder)}
                  />
                </div>
              )}
              {expanded && (
                <>
                  {createTarget &&
                    createTarget.parentId === folder.id &&
                    renderCreateRow(depth + 1)}
                  <ul className="flex flex-col">{renderTree(folder.id, depth + 1)}</ul>
                </>
              )}
            </li>
          )
        })}

        {files.map((file) => {
          const isActive = file.id === activeCodingFileId
          const isRenaming = renaming?.type === 'file' && renaming.id === file.id
          return (
            <li key={file.id}>
              {isRenaming ? (
                <RenameRow
                  style={indent}
                  value={renameValue}
                  onChange={setRenameValue}
                  onConfirm={() => handleRenameFile(file)}
                  onCancel={() => setRenaming(null)}
                />
              ) : (
                <div
                  className={cn(
                    'group flex items-center gap-1 rounded-md py-1.5 pr-1 transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                  style={indent}
                >
                  <button
                    onClick={() => setActiveCodingFileId(file.id)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  >
                    <FileCode className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-mono text-xs">{file.name}</span>
                  </button>
                  <FileMenu
                    onRename={() => startRename('file', file.id, file.name)}
                    onDelete={() => handleDeleteFile(file)}
                  />
                </div>
              )}
            </li>
          )
        })}
      </>
    )
  }

  // Inline create form (file or folder) at a given depth.
  const renderCreateRow = (depth: number) => (
    <li>
      <div
        className="mx-1 my-1 flex flex-col gap-2 rounded-md border border-border bg-secondary/30 p-2"
        style={{ marginLeft: `${depth * 12 + 4}px` }}
      >
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitCreate()
            if (e.key === 'Escape') resetCreate()
          }}
          placeholder={createTarget?.kind === 'folder' ? 'folder name' : 'filename'}
          className="h-8 font-mono text-xs"
        />
        <div className="flex items-center gap-2">
          {createTarget?.kind === 'file' && (
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
          )}
          <Button
            size="sm"
            onClick={submitCreate}
            disabled={busy}
            className="h-8 flex-1 bg-foreground font-mono text-[10px] uppercase tracking-wider text-background hover:bg-foreground/90"
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={resetCreate}
            className="h-8 px-2 font-mono text-[10px] uppercase tracking-wider"
          >
            Cancel
          </Button>
        </div>
      </div>
    </li>
  )

  const isEmpty = codingFolders.length === 0 && codingFiles.length === 0

  return (
    <div className="flex h-full flex-col bg-background">
      {!hideHeader && (
        <div className="flex shrink-0 items-center justify-between px-4 py-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
            Explorer
          </span>
        </div>
      )}

      {/* Project (repo) switcher */}
      <div className="shrink-0 px-3 pb-2">
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-secondary/40 px-2.5 py-2 text-left transition-colors hover:bg-secondary">
                <Box className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-xs text-foreground">
                  {codingProject?.name ?? 'Select project'}
                </span>
                <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-wider">
                Projects
              </DropdownMenuLabel>
              {codingProjects.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => handleSwitchProject(p)}
                  className="group/item gap-2 font-mono text-xs"
                >
                  <Box className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{p.name}</span>
                  {p.id === codingProject?.id && (
                    <Check className="ml-auto h-3.5 w-3.5" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreatingProject(true)}
                className="gap-2 font-sans text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                New project
              </DropdownMenuItem>
              {codingProject && codingProjects.length > 1 && (
                <DropdownMenuItem
                  onClick={() => handleDeleteProject(codingProject)}
                  className="gap-2 font-sans text-xs text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete current
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Root-level new file / new folder */}
          <button
            onClick={() => setCreateTarget({ kind: 'file', parentId: null })}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="New file"
            title="New file"
          >
            <FilePlus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCreateTarget({ kind: 'folder', parentId: null })}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="New folder"
            title="New folder"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>

        {/* New project inline form */}
        {creatingProject && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-secondary/30 p-2">
            <Input
              autoFocus
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject()
                if (e.key === 'Escape') setCreatingProject(false)
              }}
              placeholder="project name"
              className="h-8 font-mono text-xs"
            />
            <Button
              size="sm"
              onClick={handleCreateProject}
              disabled={busy}
              className="h-8 bg-foreground font-mono text-[10px] uppercase tracking-wider text-background hover:bg-foreground/90"
            >
              Create
            </Button>
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {/* Root-level create row */}
        {createTarget && createTarget.parentId === null && renderCreateRow(0)}

        {isEmpty && !createTarget ? (
          <p className="px-2 py-4 font-sans text-xs leading-relaxed text-muted-foreground">
            No files yet. Use the file or folder buttons above to start building
            your project.
          </p>
        ) : (
          <ul className="flex flex-col">{renderTree(null, 0)}</ul>
        )}
      </div>

      {/* Profile footer — mirrors the documents panel so the avatar/settings
          stay reachable in Coding Mode on desktop. */}
      {!hideHeader && (
        <>
          <Separator />
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar className="h-6 w-6 shrink-0">
                {profile?.avatar_url ? (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={getDisplayName(profile, userEmail)}
                  />
                ) : null}
                <AvatarFallback className="bg-secondary font-mono text-[9px] text-foreground">
                  {getInitials(profile, userEmail)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                {getDisplayName(profile, userEmail)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Small presentational helpers ───────────────────────────────────────────

function RenameRow({
  style,
  value,
  onChange,
  onConfirm,
  onCancel,
}: {
  style?: React.CSSProperties
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-1 py-1 pr-1" style={style}>
      <Input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onConfirm()
          if (e.key === 'Escape') onCancel()
        }}
        className="h-7 font-mono text-xs"
      />
      <button
        onClick={onConfirm}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        aria-label="Confirm"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onCancel}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        aria-label="Cancel"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function FolderMenu({
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}: {
  onNewFile: () => void
  onNewFolder: () => void
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
          aria-label="Folder actions"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onNewFile} className="gap-2 font-sans text-xs">
          <FilePlus className="h-3.5 w-3.5" />
          New file
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewFolder} className="gap-2 font-sans text-xs">
          <FolderPlus className="h-3.5 w-3.5" />
          New folder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onRename} className="gap-2 font-sans text-xs">
          <Pencil className="h-3.5 w-3.5" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-2 font-sans text-xs text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FileMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
          aria-label="File actions"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={onRename} className="gap-2 font-sans text-xs">
          <Pencil className="h-3.5 w-3.5" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-2 font-sans text-xs text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

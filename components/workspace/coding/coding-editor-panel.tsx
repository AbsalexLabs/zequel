'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { CodeEditor } from './code-editor'
import { UploadPreview } from './upload-preview'
import { FileLanguageIcon } from './file-language-icon'
import { getLanguageMeta } from '@/lib/coding/languages'
import { CODING_ACTIONS } from '@/lib/coding/prompts'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import {
  FileCode2,
  Check,
  Loader2,
  GraduationCap,
  ScanSearch,
  Bug,
  Wand2,
  Gauge,
  FileText,
  ClipboardCheck,
  FlaskConical,
  Zap,
} from 'lucide-react'
import type { CodingActionId, CodingFile } from '@/lib/types'

// Quick actions surfaced as toolbar buttons (analyze_project is shown separately).
const TOOLBAR_ACTIONS: { id: CodingActionId; icon: React.ReactNode }[] = [
  { id: 'explain', icon: <ScanSearch className="h-3.5 w-3.5" /> },
  { id: 'find_bugs', icon: <Bug className="h-3.5 w-3.5" /> },
  { id: 'refactor', icon: <Wand2 className="h-3.5 w-3.5" /> },
  { id: 'optimize', icon: <Gauge className="h-3.5 w-3.5" /> },
  { id: 'document', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'review', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
  { id: 'generate_tests', icon: <FlaskConical className="h-3.5 w-3.5" /> },
  { id: 'improve_performance', icon: <Zap className="h-3.5 w-3.5" /> },
]

interface CodingEditorPanelProps {
  onAction: (action: CodingActionId) => void
}

export function CodingEditorPanel({ onAction }: CodingEditorPanelProps) {
  const {
    codingFiles,
    activeCodingFileId,
    updateCodingFile,
    learningMode,
    setLearningMode,
    isCodingStreaming,
  } = useWorkspaceStore()

  const activeFile = codingFiles.find((f) => f.id === activeCodingFileId) as
    | CodingFile
    | undefined

  const isUpload = activeFile?.kind === 'upload'

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced autosave to Supabase whenever the file content changes.
  const persist = (fileId: string, content: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('saving')
    saveTimer.current = setTimeout(async () => {
      const supabase = createClient()
      await supabase
        .from('coding_files')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', fileId)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1500)
    }, 800)
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const handleChange = (value: string) => {
    if (!activeFile) return
    updateCodingFile(activeFile.id, { content: value })
    persist(activeFile.id, value)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Editor header: file name + language + learning toggle */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {activeFile ? (
            <FileLanguageIcon
              language={activeFile.language}
              kind={activeFile.kind}
              mimeType={activeFile.mime_type}
              size={16}
            />
          ) : (
            <FileCode2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate font-mono text-xs text-foreground">
            {activeFile ? activeFile.name : 'No file selected'}
          </span>
          {activeFile && !isUpload && (
            <span className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {getLanguageMeta(activeFile.language).label}
            </span>
          )}
          {activeFile && isUpload && (
            <span className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Asset
            </span>
          )}
          {saveState === 'saving' && (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
          )}
          {saveState === 'saved' && (
            <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>

        {/* Learning Mode toggle */}
        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <GraduationCap
            className={cn(
              'h-3.5 w-3.5',
              learningMode ? 'text-foreground' : 'text-muted-foreground'
            )}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Learning Mode
          </span>
          <Switch checked={learningMode} onCheckedChange={setLearningMode} />
        </label>
      </div>

      {/* Quick action toolbar */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto px-4 pb-2">
        {TOOLBAR_ACTIONS.map(({ id, icon }) => (
          <button
            key={id}
            disabled={!activeFile || isUpload || isCodingStreaming}
            onClick={() => onAction(id)}
            title={CODING_ACTIONS[id].label}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {icon}
            <span className="hidden sm:inline">{CODING_ACTIONS[id].label}</span>
          </button>
        ))}
        <button
          disabled={isCodingStreaming}
          onClick={() => onAction('analyze_project')}
          title={CODING_ACTIONS.analyze_project.label}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ScanSearch className="h-3.5 w-3.5" />
          Analyze Project
        </button>
      </div>

      {/* Editor surface */}
      <div className="min-h-0 flex-1 overflow-hidden border-t border-border">
        {activeFile ? (
          isUpload ? (
            <UploadPreview key={activeFile.id} file={activeFile} />
          ) : (
            <CodeEditor
              key={activeFile.id}
              value={activeFile.content}
              language={activeFile.language}
              onChange={handleChange}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="font-sans text-sm text-muted-foreground">
              Select or create a file to start coding.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

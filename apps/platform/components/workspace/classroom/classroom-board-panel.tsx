'use client'

import { Separator } from '@zequel/ui/components/separator'
import { Button } from '@zequel/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@zequel/ui/components/tooltip'
import { useWorkspaceStore } from '@/lib/store'
import { useClassroom } from './use-classroom'
import { TeachingWhiteboardCanvas } from './teaching-whiteboard-canvas'
import { ClassroomVoiceBar } from './classroom-voice-bar'
import { cn } from '@/lib/utils'
import {
  Play,
  FileText,
  ListChecks,
  Layers,
  Loader2,
  GraduationCap,
  LogOut,
} from 'lucide-react'

// Compact toolbar button with tooltip.
function ToolBtn({
  label,
  icon,
  onClick,
  disabled,
  tone = 'default',
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40',
            tone === 'danger'
              ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent className="font-mono text-[10px] uppercase tracking-wider">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function ClassroomBoardPanel() {
  const { activeLesson, classroomStatus, currentTopicIndex, whiteboard, isClassroomBusy } =
    useWorkspaceStore()

  const { startClass, endSession, generate } = useClassroom()

  const total = activeLesson?.outline.length ?? 0
  const hasLesson = !!activeLesson
  const isIdleForLesson = classroomStatus === 'outline' || classroomStatus === 'idle'
  const inClass =
    classroomStatus === 'teaching' ||
    classroomStatus === 'awaiting_question' ||
    classroomStatus === 'responding'
  const ended = classroomStatus === 'ended'
  const started = inClass || ended
  const progress = total > 0 ? ((currentTopicIndex + (started ? 1 : 0)) / total) * 100 : 0
  const currentTopic = activeLesson?.outline[currentTopicIndex]

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Voice-first bar — the classroom is driven by narration ─────────── */}
      <ClassroomVoiceBar />
      <Separator className="shrink-0" />

      {/* ── Slim status strip — the class runs itself, no manual stepping ──── */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-3 py-2">
        {/* End the class (only live control needed once teaching) */}
        {inClass && (
          <>
            <ToolBtn
              label="End Class"
              icon={<LogOut className="h-4 w-4" />}
              onClick={endSession}
              tone="danger"
            />
            <Separator orientation="vertical" className="mx-1 h-5" />
          </>
        )}

        {/* Post-class generation shortcuts */}
        {ended && (
          <>
            <ToolBtn label="Generate Summary" icon={<FileText className="h-4 w-4" />} onClick={() => generate('summary')} disabled={isClassroomBusy} />
            <ToolBtn label="Generate Quiz" icon={<ListChecks className="h-4 w-4" />} onClick={() => generate('quiz')} disabled={isClassroomBusy} />
            <ToolBtn label="Generate Flashcards" icon={<Layers className="h-4 w-4" />} onClick={() => generate('flashcards')} disabled={isClassroomBusy} />
            <Separator orientation="vertical" className="mx-1 h-5" />
          </>
        )}

        {/* Current topic label */}
        <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {!hasLesson
            ? 'No lesson loaded'
            : inClass && currentTopic
              ? currentTopic.title
              : ended
                ? 'Class complete'
                : 'Ready to begin'}
        </span>

        <div className="flex-1" />

        {/* Progress */}
        <div className="flex shrink-0 items-center gap-2 pl-2">
          {isClassroomBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {hasLesson ? `Topic ${started ? currentTopicIndex + 1 : 0}/${total}` : '--'}
          </span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <Separator className="shrink-0" />

      {/* ── Teaching surface ──────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1">
        <TeachingWhiteboardCanvas
          content={whiteboard}
          placeholder={
            hasLesson
              ? 'Press Start AI Class to begin the lecture.'
              : 'Build a lesson from your uploaded materials to begin.'
          }
        />

        {/* Start-class overlay — shown before the class begins. Just one button:
            the AI does everything once it starts. */}
        {hasLesson && isIdleForLesson && (
          <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-background/85 backdrop-blur-sm">
            <div className="m-4 w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                  AI Class
                </span>
              </div>
              <h2 className="mt-3 text-pretty font-sans text-base font-semibold text-foreground">
                {activeLesson.title}
              </h2>
              {activeLesson.description && (
                <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground">
                  {activeLesson.description}
                </p>
              )}
              <p className="mt-3 font-sans text-xs leading-relaxed text-muted-foreground">
                {total} topics. Once you begin, the instructor teaches automatically — writing the
                board and speaking as it goes. Raise your hand any time to ask a question.
              </p>
              <Button
                onClick={startClass}
                disabled={isClassroomBusy}
                className="mt-5 h-10 w-full justify-center gap-2 rounded-md bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:bg-foreground/90"
              >
                {isClassroomBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start AI Class
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Topic progress rail (read-only — the class advances itself) ─────── */}
      <Separator className="shrink-0" />
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-3 py-2">
        {activeLesson?.outline.map((t, i) => {
          const done = t.status === 'completed'
          const current = i === currentTopicIndex && started
          return (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <span
                  aria-label={`Topic ${i + 1}: ${t.title}`}
                  className={cn(
                    'flex h-1.5 min-w-6 flex-1 shrink-0 rounded-full transition-colors',
                    current ? 'bg-foreground' : done ? 'bg-foreground/50' : 'bg-secondary'
                  )}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] font-sans text-[11px]">
                {i + 1}. {t.title}
              </TooltipContent>
            </Tooltip>
          )
        })}
        {!hasLesson && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            No topics yet
          </span>
        )}
      </div>
    </div>
  )
}

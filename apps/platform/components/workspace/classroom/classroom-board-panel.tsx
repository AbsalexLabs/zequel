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
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FileText,
  ListChecks,
  Layers,
  Loader2,
  GraduationCap,
  CheckCircle2,
  Circle,
  CircleDot,
} from 'lucide-react'

// Compact toolbar button with tooltip.
function ToolBtn({
  label,
  icon,
  onClick,
  disabled,
  active,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
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
            active
              ? 'bg-foreground text-background'
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
  const {
    activeLesson,
    classroomStatus,
    currentTopicIndex,
    whiteboard,
    isClassroomBusy,
  } = useWorkspaceStore()

  const {
    startLesson,
    pauseLesson,
    resumeLesson,
    nextTopic,
    previousTopic,
    repeatTopic,
    generate,
    teachIndex,
  } = useClassroom()

  const total = activeLesson?.outline.length ?? 0
  const hasLesson = !!activeLesson
  const isTeaching = classroomStatus === 'teaching'
  const isPaused = classroomStatus === 'paused'
  const started = isTeaching || isPaused || classroomStatus === 'ended'
  const progress = total > 0 ? ((currentTopicIndex + (started ? 1 : 0)) / total) * 100 : 0

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Voice-first bar — the classroom is driven by narration ─────────── */}
      <ClassroomVoiceBar />
      <Separator className="shrink-0" />

      {/* ── Lesson controls toolbar ───────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto px-3 py-2">
        {/* Playback */}
        {isTeaching ? (
          <ToolBtn label="Pause" icon={<Pause className="h-4 w-4" />} onClick={pauseLesson} disabled={isClassroomBusy} />
        ) : isPaused ? (
          <ToolBtn label="Resume" icon={<Play className="h-4 w-4" />} onClick={resumeLesson} disabled={isClassroomBusy} active />
        ) : (
          <ToolBtn
            label="Start Lesson"
            icon={<Play className="h-4 w-4" />}
            onClick={startLesson}
            disabled={!hasLesson || isClassroomBusy}
            active={hasLesson}
          />
        )}
        <ToolBtn label="Previous Topic" icon={<SkipBack className="h-4 w-4" />} onClick={previousTopic} disabled={!started || isClassroomBusy || currentTopicIndex === 0} />
        <ToolBtn label="Next Topic" icon={<SkipForward className="h-4 w-4" />} onClick={nextTopic} disabled={!started || isClassroomBusy || currentTopicIndex >= total - 1} />
        <ToolBtn label="Repeat" icon={<RotateCcw className="h-4 w-4" />} onClick={repeatTopic} disabled={!started || isClassroomBusy} />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Generation */}
        <ToolBtn label="Generate Summary" icon={<FileText className="h-4 w-4" />} onClick={() => generate('summary')} disabled={!hasLesson || isClassroomBusy} />
        <ToolBtn label="Generate Quiz" icon={<ListChecks className="h-4 w-4" />} onClick={() => generate('quiz')} disabled={!hasLesson || isClassroomBusy} />
        <ToolBtn label="Generate Flashcards" icon={<Layers className="h-4 w-4" />} onClick={() => generate('flashcards')} disabled={!hasLesson || isClassroomBusy} />

        <div className="flex-1" />

        {/* Progress */}
        <div className="flex shrink-0 items-center gap-2 pl-2">
          {isClassroomBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {hasLesson ? `Topic ${started ? currentTopicIndex + 1 : 0}/${total}` : 'No lesson'}
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
              ? 'Press Start Lesson to begin teaching.'
              : 'Build a lesson from your uploaded materials to begin.'
          }
        />

        {/* Outline review overlay — shown before the lesson starts */}
        {hasLesson && classroomStatus === 'outline' && (
          <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm">
            <div className="m-4 w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                  Lesson Outline
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
              <ol className="mt-4 flex flex-col gap-1.5">
                {activeLesson.outline.map((t, i) => (
                  <li key={t.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[10px] text-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-sans text-[13px] font-medium text-foreground">{t.title}</p>
                      {t.summary && (
                        <p className="font-sans text-xs leading-relaxed text-muted-foreground">{t.summary}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              <Button
                onClick={startLesson}
                disabled={isClassroomBusy}
                className="mt-5 h-9 w-full justify-center gap-2 rounded-md bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:bg-foreground/90"
              >
                {isClassroomBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Start Lesson
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Topic stepper rail ────────────────────────────────────────────── */}
      <Separator className="shrink-0" />
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto px-3 py-2">
        {activeLesson?.outline.map((t, i) => {
          const done = t.status === 'completed'
          const current = i === currentTopicIndex && started
          return (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => teachIndex(i)}
                  disabled={isClassroomBusy || !started}
                  aria-label={`Topic ${i + 1}: ${t.title}`}
                  className={cn(
                    'flex h-6 shrink-0 items-center gap-1 rounded px-1.5 transition-colors disabled:opacity-50',
                    current ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {current ? (
                    <CircleDot className="h-3.5 w-3.5" />
                  ) : done ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                  <span className="font-mono text-[10px]">{i + 1}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] font-sans text-[11px]">{t.title}</TooltipContent>
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

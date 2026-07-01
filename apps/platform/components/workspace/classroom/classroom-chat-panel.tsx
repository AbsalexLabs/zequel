'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Separator } from '@zequel/ui/components/separator'
import { useWorkspaceStore } from '@/lib/store'
import { useClassroom } from './use-classroom'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { cn } from '@/lib/utils'
import {
  Send,
  Hand,
  Play,
  LogOut,
  GraduationCap,
  Loader2,
  MessageSquare,
  ListTree,
  Info,
  Mic,
  CheckCircle2,
  CircleDot,
  Circle,
  BookOpen,
} from 'lucide-react'

type InteractionTab = 'conversation' | 'timeline' | 'session'

const TABS: { id: InteractionTab; label: string; icon: React.ReactNode }[] = [
  { id: 'conversation', label: 'Talk', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { id: 'timeline', label: 'Timeline', icon: <ListTree className="h-3.5 w-3.5" /> },
  { id: 'session', label: 'Session', icon: <Info className="h-3.5 w-3.5" /> },
]

export function ClassroomChatPanel() {
  const {
    classroomMessages,
    isClassroomBusy,
    activeLesson,
    classroomStatus,
    currentTopicIndex,
    classroomVoice,
  } = useWorkspaceStore()
  const { askQuestion, raiseHand, resumeClass, endSession } = useClassroom()

  const [tab, setTab] = useState<InteractionTab>('conversation')
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasLesson = !!activeLesson
  const isTeaching = classroomStatus === 'teaching'
  const awaiting = classroomStatus === 'awaiting_question'
  const inClass = isTeaching || awaiting || classroomStatus === 'responding'
  const started = inClass || classroomStatus === 'ended'
  // Questions can be asked while teaching or once the hand is already raised.
  const canAsk = hasLesson && (isTeaching || awaiting)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [])

  useEffect(() => {
    if (tab === 'conversation') scrollToBottom()
  }, [classroomMessages, isClassroomBusy, tab, scrollToBottom])

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = '24px'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = () => {
    const text = input.trim()
    if (!text || !canAsk) return
    // Typing a question while the lecture is running raises your hand implicitly.
    askQuestion(text)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '24px'
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-2.5">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
          Interaction
        </span>
        {isClassroomBusy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        {classroomVoice.micActive && (
          <span className="ml-auto flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-destructive">
            <Mic className="h-3 w-3" />
            Listening
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 items-center gap-0.5 px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-t-md border-b-2 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors',
              tab === t.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      <Separator className="shrink-0" />

      {/* ── Conversation tab ──────────────────────────────────────────────── */}
      {tab === 'conversation' && (
        <>
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {classroomMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <GraduationCap className="h-5 w-5 text-muted-foreground/40" />
                <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  The lecture will appear here
                </p>
                <p className="mt-1 font-sans text-xs text-muted-foreground/60">
                  {hasLesson
                    ? 'Press Start AI Class. Raise your hand or type any time to interrupt.'
                    : 'Build and load a lesson to begin.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {classroomMessages.map((m) => (
                  <MessageBubble key={m.id} role={m.role} content={m.content} />
                ))}
                {isClassroomBusy && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Instructor
                    </span>
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Raise-hand / resume / end controls — the class runs itself, so the
              student only ever interrupts, resumes, or ends. */}
          <Separator className="shrink-0" />
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-3 py-2">
            {awaiting ? (
              <button
                onClick={resumeClass}
                className="flex items-center gap-1.5 rounded-full border border-foreground/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
              >
                <Play className="h-3 w-3" />
                Resume Lecture
              </button>
            ) : (
              <button
                onClick={raiseHand}
                disabled={!isTeaching}
                className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-40"
              >
                <Hand className="h-3 w-3" />
                Raise Hand
              </button>
            )}
            {inClass && (
              <button
                onClick={endSession}
                className="flex items-center gap-1.5 rounded-full border border-destructive/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-3 w-3" />
                End Class
              </button>
            )}
            {awaiting && (
              <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Ask your question below
              </span>
            )}
          </div>

          {/* Input — type a question to interrupt the lecture at any time */}
          <div className="shrink-0 px-3 pb-3">
            <div className="flex items-end gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing &&
                    e.keyCode !== 229
                  ) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                placeholder={
                  canAsk
                    ? 'Ask the instructor a question…'
                    : hasLesson
                      ? 'Start the class to ask questions'
                      : 'Load a lesson to interact'
                }
                disabled={!canAsk}
                className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!canAsk || !input.trim()}
                aria-label="Send"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-opacity hover:bg-foreground/90 disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Lesson timeline tab ───────────────────────────────────────────── */}
      {tab === 'timeline' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {!hasLesson ? (
            <EmptyState icon={<ListTree className="h-5 w-5" />} text="No lesson loaded" />
          ) : (
            <ol className="flex flex-col">
              {activeLesson.outline.map((t, i) => {
                const done = t.status === 'completed'
                const current = i === currentTopicIndex && started
                return (
                  <li key={t.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {/* connector line */}
                    {i < activeLesson.outline.length - 1 && (
                      <span className="absolute left-[11px] top-6 h-full w-px bg-border" aria-hidden="true" />
                    )}
                    <span
                      aria-label={`Topic ${i + 1}`}
                      className="z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground"
                    >
                      {current ? (
                        <CircleDot className="h-4 w-4 text-foreground" />
                      ) : done ? (
                        <CheckCircle2 className="h-4 w-4 text-foreground" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'font-sans text-[13px] font-medium',
                          current ? 'text-foreground' : 'text-foreground/90'
                        )}
                      >
                        {t.title}
                      </p>
                      {t.summary && (
                        <p className="mt-0.5 font-sans text-xs leading-relaxed text-muted-foreground">
                          {t.summary}
                        </p>
                      )}
                      <span className="mt-1 inline-block font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                        {current ? 'In progress' : done ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}

      {/* ── Session info tab ──────────────────────────────────────────────── */}
      {tab === 'session' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {!hasLesson ? (
            <EmptyState icon={<Info className="h-5 w-5" />} text="No active session" />
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                  Lesson
                </p>
                <p className="mt-1 text-pretty font-sans text-sm font-semibold text-foreground">
                  {activeLesson.title}
                </p>
                {activeLesson.description && (
                  <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground">
                    {activeLesson.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <InfoStat label="Status" value={statusLabel(classroomStatus)} />
                <InfoStat label="Topics" value={`${activeLesson.outline.length}`} />
                <InfoStat
                  label="Progress"
                  value={`${started ? currentTopicIndex + 1 : 0}/${activeLesson.outline.length}`}
                />
                <InfoStat
                  label="Completed"
                  value={`${activeLesson.outline.filter((t) => t.status === 'completed').length}`}
                />
              </div>

              {activeLesson.source_document_titles.length > 0 && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                    Source Materials
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {activeLesson.source_document_titles.map((title, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-2.5 py-1.5"
                      >
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate font-sans text-xs text-foreground">{title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function statusLabel(status: string) {
  switch (status) {
    case 'analyzing':
      return 'Analyzing'
    case 'outline':
      return 'Ready'
    case 'teaching':
      return 'Teaching'
    case 'awaiting_question':
      return 'Your turn'
    case 'responding':
      return 'Answering'
    case 'paused':
      return 'Paused'
    case 'ended':
      return 'Ended'
    default:
      return 'Idle'
  }
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 px-2.5 py-2">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-0.5 font-sans text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center text-muted-foreground/40">
      {icon}
      <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {text}
      </p>
    </div>
  )
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  if (role === 'system') {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-secondary/60 px-3 py-1 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {content}
        </span>
      </div>
    )
  }

  const isStudent = role === 'student'

  return (
    <div className={cn('flex flex-col gap-1', isStudent ? 'items-end' : 'items-start')}>
      <span className="px-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
        {isStudent ? 'You' : 'Instructor'}
      </span>
      <div
        className={cn(
          'max-w-[88%] rounded-lg px-3 py-2 text-[13px] leading-relaxed',
          isStudent
            ? 'bg-foreground text-background'
            : 'border border-border bg-secondary/40 text-foreground'
        )}
      >
        {isStudent ? (
          <p className="whitespace-pre-wrap font-sans">{content}</p>
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </div>
    </div>
  )
}

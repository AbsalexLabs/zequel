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
  HelpCircle,
  Gauge,
  Repeat,
  Plus,
  SkipForward,
  LogOut,
  GraduationCap,
  Loader2,
} from 'lucide-react'
import type { StudentActionId } from '@zequel/types'

// Local labels + icons (kept out of the server prompt module so it isn't
// bundled into the client).
const STUDENT_ACTIONS: {
  id: StudentActionId
  label: string
  icon: React.ReactNode
}[] = [
  { id: 'ask_question', label: 'Ask Question', icon: <HelpCircle className="h-3 w-3" /> },
  { id: 'raise_hand', label: 'Raise Hand', icon: <Hand className="h-3 w-3" /> },
  { id: 'slow_down', label: 'Slow Down', icon: <Gauge className="h-3 w-3" /> },
  { id: 'repeat_explanation', label: 'Repeat', icon: <Repeat className="h-3 w-3" /> },
  { id: 'another_example', label: 'Another Example', icon: <Plus className="h-3 w-3" /> },
  { id: 'skip_topic', label: 'Skip Topic', icon: <SkipForward className="h-3 w-3" /> },
  { id: 'end_session', label: 'End Session', icon: <LogOut className="h-3 w-3" /> },
]

export function ClassroomChatPanel() {
  const { classroomMessages, isClassroomBusy, activeLesson } = useWorkspaceStore()
  const { askQuestion, studentAction } = useClassroom()

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasLesson = !!activeLesson
  const disabled = !hasLesson || isClassroomBusy

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [classroomMessages, isClassroomBusy, scrollToBottom])

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = '24px'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = () => {
    const text = input.trim()
    if (!text || disabled) return
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
          Classroom
        </span>
        {isClassroomBusy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <Separator className="shrink-0" />

      {/* Conversation */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {classroomMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <GraduationCap className="h-5 w-5 text-muted-foreground/40" />
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              The lecture will appear here
            </p>
            <p className="mt-1 font-sans text-xs text-muted-foreground/60">
              {hasLesson ? 'Start the lesson, then ask questions any time.' : 'Build and load a lesson to begin.'}
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

      {/* Student controls */}
      <Separator className="shrink-0" />
      <div className="flex shrink-0 flex-wrap gap-1.5 px-3 py-2">
        {STUDENT_ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => studentAction(a.id, a.label)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40',
              a.id === 'end_session'
                ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            )}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* Input */}
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
            placeholder={hasLesson ? 'Ask the instructor a question…' : 'Load a lesson to interact'}
            disabled={disabled}
            className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            aria-label="Send"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-opacity hover:bg-foreground/90 disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
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

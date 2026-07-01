'use client'

import { useState } from 'react'
import { Separator } from '@zequel/ui/components/separator'
import { Button } from '@zequel/ui/components/button'
import { ZequelLogo } from '@zequel/ui/components/zequel-logo'
import { ThemeToggle } from '@zequel/ui/components/theme-toggle'
import { Avatar, AvatarImage, AvatarFallback } from '@zequel/ui/components/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@zequel/ui/components/tooltip'
import { useWorkspaceStore } from '@/lib/store'
import { useClassroom } from './use-classroom'
import { NoteDialog, FlashcardDialog, QuizDialog } from './artifact-dialogs'
import { cn } from '@/lib/utils'
import type {
  Profile,
  ClassroomSidebarSection,
  GeneratedNote,
  FlashcardDeck,
  Quiz,
} from '@zequel/types'
import {
  BookOpen,
  FileStack,
  History,
  NotebookPen,
  Layers,
  ListChecks,
  Upload,
  Check,
  Trash2,
  Loader2,
  Settings,
  FileText,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

interface ClassroomSidebarProps {
  onUploadClick: () => void
  userEmail?: string
  profile?: Profile | null
  hideHeader?: boolean
}

const SECTIONS: {
  id: ClassroomSidebarSection
  label: string
  icon: React.ReactNode
}[] = [
  { id: 'lessons', label: 'Lessons', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'materials', label: 'Materials', icon: <FileStack className="h-4 w-4" /> },
  { id: 'history', label: 'History', icon: <History className="h-4 w-4" /> },
  { id: 'notes', label: 'Notes', icon: <NotebookPen className="h-4 w-4" /> },
  { id: 'flashcards', label: 'Flashcards', icon: <Layers className="h-4 w-4" /> },
  { id: 'quizzes', label: 'Quizzes', icon: <ListChecks className="h-4 w-4" /> },
]

function getDisplayName(profile?: Profile | null, userEmail?: string) {
  if (profile?.full_name) return profile.full_name
  if (profile?.display_name) return profile.display_name
  if (profile?.username) return `@${profile.username}`
  return userEmail || 'Account'
}

function getInitials(profile?: Profile | null, userEmail?: string) {
  const name = profile?.full_name || profile?.display_name || userEmail || 'U'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function ClassroomSidebar({
  onUploadClick,
  userEmail,
  profile,
  hideHeader,
}: ClassroomSidebarProps) {
  const { classroomSection, setClassroomSection } = useWorkspaceStore()

  const [note, setNote] = useState<GeneratedNote | null>(null)
  const [deck, setDeck] = useState<FlashcardDeck | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)

  const active = SECTIONS.find((s) => s.id === classroomSection) ?? SECTIONS[0]

  return (
    <div className="flex h-full bg-background">
      {/* Icon rail */}
      <nav
        className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border py-2"
        aria-label="Classroom sections"
      >
        {SECTIONS.map((s) => (
          <Tooltip key={s.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setClassroomSection(s.id)}
                aria-label={s.label}
                aria-current={classroomSection === s.id}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                  classroomSection === s.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                {s.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-[10px] uppercase tracking-wider">
              {s.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!hideHeader && (
          <>
            <div className="flex items-center justify-between px-3 py-3">
              <ZequelLogo />
              <ThemeToggle />
            </div>
            <Separator />
          </>
        )}

        {/* Section title */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="text-muted-foreground">{active.icon}</span>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
            {active.label}
          </span>
        </div>
        <Separator />

        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {classroomSection === 'lessons' && <LessonsSection />}
          {classroomSection === 'materials' && <MaterialsSection onUploadClick={onUploadClick} />}
          {classroomSection === 'history' && <HistorySection />}
          {classroomSection === 'notes' && <NotesSection onOpen={setNote} />}
          {classroomSection === 'flashcards' && <FlashcardsSection onOpen={setDeck} />}
          {classroomSection === 'quizzes' && <QuizzesSection onOpen={setQuiz} />}
        </div>

        {!hideHeader && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Avatar className="h-6 w-6 shrink-0">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={getDisplayName(profile, userEmail)} />
                  ) : null}
                  <AvatarFallback className="bg-secondary font-mono text-[9px] text-foreground">
                    {getInitials(profile, userEmail)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {getDisplayName(profile, userEmail)}
                </span>
              </div>
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      <NoteDialog note={note} onClose={() => setNote(null)} />
      <FlashcardDialog deck={deck} onClose={() => setDeck(null)} />
      <QuizDialog quiz={quiz} onClose={() => setQuiz(null)} />
    </div>
  )
}

// ── Empty state helper ────────────────────────────────────────────────────────
function Empty({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-muted-foreground/40">{icon}</span>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {hint && <p className="mt-1 font-sans text-xs text-muted-foreground/60">{hint}</p>}
    </div>
  )
}

// ── Lessons ───────────────────────────────────────────────────────────────────
function LessonsSection() {
  const { lessons, activeLesson, removeLesson } = useWorkspaceStore()
  const { loadLesson } = useClassroom()

  if (lessons.length === 0) {
    return (
      <Empty
        icon={<BookOpen className="h-6 w-6" />}
        title="No lessons yet"
        hint="Select uploaded materials to build your first lesson."
      />
    )
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {lessons.map((l) => (
        <div
          key={l.id}
          className={cn(
            'group flex items-start gap-2 rounded-md px-2 py-2 transition-colors',
            activeLesson?.id === l.id ? 'bg-secondary' : 'hover:bg-secondary/50'
          )}
        >
          <button onClick={() => loadLesson(l.id)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[13px] font-medium text-foreground">{l.title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {l.outline.length} topics
              </p>
            </div>
          </button>
          <button
            onClick={() => removeLesson(l.id)}
            aria-label={`Delete ${l.title}`}
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Materials ─────────────────────────────────────────────────────────────────
function MaterialsSection({ onUploadClick }: { onUploadClick: () => void }) {
  const { documents, selectedDocumentIds, toggleDocumentSelection, isClassroomBusy } =
    useWorkspaceStore()
  const { buildLesson } = useClassroom()

  return (
    <div className="flex h-full flex-col">
      <div className="p-2">
        <Button
          onClick={onUploadClick}
          variant="outline"
          className="h-9 w-full justify-start gap-2 rounded-md border-border font-mono text-xs uppercase tracking-wider text-foreground"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Material
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2">
        {documents.length === 0 ? (
          <Empty
            icon={<FileStack className="h-6 w-6" />}
            title="No materials"
            hint="Upload PDFs, slides, or notes to teach from."
          />
        ) : (
          <div className="flex flex-col gap-0.5 pb-2">
            {documents.map((doc) => {
              const selected = selectedDocumentIds.includes(doc.id)
              return (
                <button
                  key={doc.id}
                  onClick={() => toggleDocumentSelection(doc.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors',
                    selected ? 'bg-secondary text-foreground' : 'text-foreground hover:bg-secondary/50'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                      selected ? 'border-foreground bg-foreground' : 'border-border'
                    )}
                  >
                    {selected && <Check className="h-2.5 w-2.5 text-background" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-[13px] font-medium leading-tight" title={doc.title}>
                      {doc.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <FileText className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {doc.page_count > 0 ? `${doc.page_count} pages` : '--'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Separator />
      <div className="p-2">
        <Button
          onClick={buildLesson}
          disabled={isClassroomBusy || selectedDocumentIds.length === 0}
          className="h-9 w-full justify-center gap-2 rounded-md bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:bg-foreground/90"
        >
          {isClassroomBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Build Lesson
          {selectedDocumentIds.length > 0 && ` (${selectedDocumentIds.length})`}
        </Button>
      </div>
    </div>
  )
}

// ── Session History ─────────────────────────────────────────────────────────
function HistorySection() {
  const { classroomSessions } = useWorkspaceStore()

  if (classroomSessions.length === 0) {
    return <Empty icon={<History className="h-6 w-6" />} title="No sessions yet" hint="Start a lesson to record a session." />
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {classroomSessions.map((s) => (
        <div key={s.id} className="rounded-md px-2 py-2 hover:bg-secondary/50">
          <p className="truncate font-sans text-[13px] font-medium text-foreground">{s.lesson_title}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.status}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {new Date(s.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Notes ─────────────────────────────────────────────────────────────────────
function NotesSection({ onOpen }: { onOpen: (n: GeneratedNote) => void }) {
  const { generatedNotes, removeGeneratedNote } = useWorkspaceStore()

  if (generatedNotes.length === 0) {
    return <Empty icon={<NotebookPen className="h-6 w-6" />} title="No notes yet" hint="Generate a summary or notes after teaching." />
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {generatedNotes.map((n) => (
        <div key={n.id} className="group flex items-start gap-2 rounded-md px-2 py-2 hover:bg-secondary/50">
          <button onClick={() => onOpen(n)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
            <NotebookPen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[13px] font-medium text-foreground">{n.lesson_title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
                {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </button>
          <button
            onClick={() => removeGeneratedNote(n.id)}
            aria-label="Delete note"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/60 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Flashcards ────────────────────────────────────────────────────────────────
function FlashcardsSection({ onOpen }: { onOpen: (d: FlashcardDeck) => void }) {
  const { flashcardDecks, removeFlashcardDeck } = useWorkspaceStore()

  if (flashcardDecks.length === 0) {
    return <Empty icon={<Layers className="h-6 w-6" />} title="No flashcards yet" hint="Generate flashcards from a lesson." />
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {flashcardDecks.map((d) => (
        <div key={d.id} className="group flex items-start gap-2 rounded-md px-2 py-2 hover:bg-secondary/50">
          <button onClick={() => onOpen(d)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
            <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[13px] font-medium text-foreground">{d.lesson_title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{d.cards.length} cards</p>
            </div>
          </button>
          <button
            onClick={() => removeFlashcardDeck(d.id)}
            aria-label="Delete deck"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/60 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Quizzes ───────────────────────────────────────────────────────────────────
function QuizzesSection({ onOpen }: { onOpen: (q: Quiz) => void }) {
  const { quizzes, removeQuiz } = useWorkspaceStore()

  if (quizzes.length === 0) {
    return <Empty icon={<ListChecks className="h-6 w-6" />} title="No quizzes yet" hint="Generate a quiz from a lesson." />
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {quizzes.map((q) => (
        <div key={q.id} className="group flex items-start gap-2 rounded-md px-2 py-2 hover:bg-secondary/50">
          <button onClick={() => onOpen(q)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
            <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[13px] font-medium text-foreground">{q.lesson_title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{q.questions.length} questions</p>
            </div>
          </button>
          <button
            onClick={() => removeQuiz(q.id)}
            aria-label="Delete quiz"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/60 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

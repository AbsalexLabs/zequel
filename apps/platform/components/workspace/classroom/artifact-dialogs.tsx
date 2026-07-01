'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@zequel/ui/components/dialog'
import { Button } from '@zequel/ui/components/button'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Check, X, RotateCcw } from 'lucide-react'
import type { GeneratedNote, FlashcardDeck, Quiz } from '@zequel/types'

// ── Notes / summary viewer ────────────────────────────────────────────────────
export function NoteDialog({
  note,
  onClose,
}: {
  note: GeneratedNote | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!note} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden border-border bg-background">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            {note?.lesson_title}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto pr-1">
          {note && <MarkdownRenderer content={note.content} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Flashcard deck viewer ─────────────────────────────────────────────────────
export function FlashcardDialog({
  deck,
  onClose,
}: {
  deck: FlashcardDeck | null
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const cards = deck?.cards ?? []
  const card = cards[index]

  const go = (dir: number) => {
    setFlipped(false)
    setIndex((i) => Math.min(Math.max(i + dir, 0), cards.length - 1))
  }

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      onClose()
      setIndex(0)
      setFlipped(false)
    }
  }

  return (
    <Dialog open={!!deck} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg border-border bg-background">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            {deck?.lesson_title} · Flashcards
          </DialogTitle>
        </DialogHeader>

        {card && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-secondary/40 p-6 text-center transition-colors hover:bg-secondary/60"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {flipped ? 'Answer' : 'Question'}
              </span>
              <span className="text-pretty font-sans text-base leading-relaxed text-foreground">
                {flipped ? card.back : card.front}
              </span>
              <span className="mt-2 font-mono text-[10px] text-muted-foreground/60">
                Tap to flip
              </span>
            </button>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => go(-1)}
                disabled={index === 0}
                className="h-8 gap-1.5 rounded-md border-border font-mono text-[10px] uppercase tracking-wider"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <span className="font-mono text-[11px] text-muted-foreground">
                {index + 1} / {cards.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => go(1)}
                disabled={index === cards.length - 1}
                className="h-8 gap-1.5 rounded-md border-border font-mono text-[10px] uppercase tracking-wider"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Quiz taker ────────────────────────────────────────────────────────────────
export function QuizDialog({
  quiz,
  onClose,
}: {
  quiz: Quiz | null
  onClose: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const questions = quiz?.questions ?? []
  const score = questions.reduce(
    (acc, q) => acc + (answers[q.id] === q.answer_index ? 1 : 0),
    0
  )

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      onClose()
      reset()
    }
  }

  return (
    <Dialog open={!!quiz} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden border-border bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            <span>{quiz?.lesson_title} · Quiz</span>
            {submitted && (
              <span className="font-mono text-xs text-muted-foreground">
                Score {score}/{questions.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto pr-1">
          {questions.map((q, qi) => (
            <div key={q.id} className="flex flex-col gap-2">
              <p className="font-sans text-sm font-medium leading-relaxed text-foreground">
                {qi + 1}. {q.question}
              </p>
              <div className="flex flex-col gap-1.5">
                {q.options.map((opt, oi) => {
                  const selected = answers[q.id] === oi
                  const correct = q.answer_index === oi
                  const showState = submitted
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [q.id]: oi }))
                      }
                      className={cn(
                        'flex items-center gap-2.5 rounded-md border px-3 py-2 text-left font-sans text-[13px] transition-colors',
                        showState && correct
                          ? 'border-foreground bg-secondary text-foreground'
                          : showState && selected && !correct
                            ? 'border-destructive/50 bg-destructive/10 text-foreground'
                            : selected
                              ? 'border-foreground bg-secondary/60 text-foreground'
                              : 'border-border text-foreground hover:bg-secondary/40'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border font-mono text-[9px]',
                          selected || (showState && correct)
                            ? 'border-foreground'
                            : 'border-border'
                        )}
                      >
                        {showState && correct ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : showState && selected && !correct ? (
                          <X className="h-2.5 w-2.5" />
                        ) : (
                          String.fromCharCode(65 + oi)
                        )}
                      </span>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {submitted && q.explanation && (
                <p className="rounded-md bg-secondary/40 px-3 py-2 font-sans text-xs leading-relaxed text-muted-foreground">
                  {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          {submitted ? (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="h-8 gap-1.5 rounded-md border-border font-mono text-[10px] uppercase tracking-wider"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < questions.length}
              className="h-8 rounded-md bg-foreground font-mono text-[10px] uppercase tracking-wider text-background hover:bg-foreground/90"
            >
              Submit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useEffect } from 'react'
import { useWorkspaceStore } from '@/lib/store'
import { speakAsync, cancelSpeech, warmUpVoices, createRecognizer, type Recognizer } from './speech'
import { generateLecture, interact } from './engine'
import type { ClassroomMessageRole, WhiteboardContent, LectureSegment } from '@zequel/types'

// ─────────────────────────────────────────────────────────────────────────────
// The Classroom Director.
//
// This is the "director" from the product spec: the AI generates teaching
// content, but the Director decides WHEN to speak, WHEN to write the board, when
// to pause for a question, and when to resume. The class runs itself — the
// student just watches, and can raise their hand (button or voice) to interrupt.
//
// It runs a cursor-driven state machine over the active lesson:
//   greet → for each topic { fetch segmented lecture → play each beat } → close
//
// A single running `epoch` plus a `paused` flag make the loop instantly
// interruptible and cleanly resumable from where it left off.
// ─────────────────────────────────────────────────────────────────────────────

function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

// Phrases that trigger a voice interruption while the instructor is speaking.
const WAKE_RE = /\b(excuse me|stop|wait|hold on|hang on|pause|question|sorry|hey teacher|hey)\b/i

interface Cursor {
  topicIndex: number
  segmentIndex: number
}

class ClassroomDirector {
  private epoch = 0
  private paused = false
  private cursor: Cursor = { topicIndex: 0, segmentIndex: 0 }
  // The running (accumulated) board for the current topic.
  private board: WhiteboardContent = { title: '', explanation: '', keyPoints: [], examples: [], equations: [] }
  private segCache = new Map<number, LectureSegment[]>()
  private recognizer: Recognizer | null = null
  private micWanted = false

  private get store() {
    return useWorkspaceStore.getState()
  }

  private push(role: ClassroomMessageRole, content: string, topicIndex?: number) {
    this.store.addClassroomMessage({
      id: uid(),
      role,
      content,
      created_at: new Date().toISOString(),
      topic_index: topicIndex,
    })
  }

  private aborted(epoch: number): boolean {
    return this.paused || epoch !== this.epoch
  }

  private commitBoard() {
    // Push a fresh object so the whiteboard canvas diffs & animates the change.
    this.store.setWhiteboard({
      title: this.board.title,
      explanation: this.board.explanation,
      keyPoints: [...this.board.keyPoints],
      examples: [...this.board.examples],
      equations: this.board.equations ? [...this.board.equations] : [],
    })
  }

  private applyDelta(delta?: LectureSegment['board']) {
    if (!delta) return
    if (delta.title) this.board.title = delta.title
    if (delta.explanation) {
      this.board.explanation = this.board.explanation
        ? `${this.board.explanation}\n\n${delta.explanation}`
        : delta.explanation
    }
    if (delta.keyPoints?.length) this.board.keyPoints = [...this.board.keyPoints, ...delta.keyPoints]
    if (delta.examples?.length) this.board.examples = [...this.board.examples, ...delta.examples]
    if (delta.equations?.length)
      this.board.equations = [...(this.board.equations ?? []), ...delta.equations]
  }

  // ── Start (or restart) the whole class from the beginning ──────────────────
  async startClass(): Promise<void> {
    const s = this.store
    const lesson = s.activeLesson
    if (!lesson) return

    warmUpVoices()
    cancelSpeech()

    this.epoch++
    const epoch = this.epoch
    this.paused = false
    this.cursor = { topicIndex: 0, segmentIndex: 0 }
    this.segCache.clear()

    // Open a session in history (or reuse an unfinished one).
    const existing = s.classroomSessions.find((ss) => ss.lesson_id === lesson.id && !ss.ended_at)
    if (!existing) {
      s.addClassroomSession({
        id: uid(),
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        status: 'teaching',
        current_topic_index: 0,
        started_at: new Date().toISOString(),
        ended_at: null,
      })
    }

    s.setClassroomMessages([])
    s.setCurrentTopicIndex(0)
    s.setClassroomStatus('teaching')

    // Open the board with just the lesson title, like walking up to a fresh board.
    this.board = { title: lesson.title, explanation: '', keyPoints: [], examples: [], equations: [] }
    this.commitBoard()

    const greeting = `Welcome. Today I'll be teaching ${lesson.title} using the material you uploaded. Let's begin.`
    this.push('instructor', greeting, 0)
    await speakAsync(greeting)
    if (this.aborted(epoch)) return

    this.startMicIfWanted()
    await this.loop(epoch)
  }

  // ── The teaching loop ──────────────────────────────────────────────────────
  private async loop(epoch: number): Promise<void> {
    const lesson = this.store.activeLesson
    if (!lesson) return
    const n = lesson.outline.length

    while (this.cursor.topicIndex < n) {
      if (this.aborted(epoch)) return

      const ti = this.cursor.topicIndex
      const topic = lesson.outline[ti]
      if (!topic) break

      this.store.setCurrentTopicIndex(ti)
      this.store.setClassroomStatus('teaching')
      lesson.outline.forEach((t, i) =>
        this.store.updateActiveLessonTopic(t.id, {
          status: i < ti ? 'completed' : i === ti ? 'active' : 'pending',
        })
      )
      this.syncSession(ti)

      // Fetch (and cache) the segmented lecture for this topic.
      let segments = this.segCache.get(ti)
      if (!segments) {
        try {
          const result = await generateLecture({ lesson, topicIndex: ti })
          segments = result.segments
        } catch (err) {
          if (this.aborted(epoch)) return
          this.push(
            'system',
            err instanceof Error ? err.message : 'Could not load this topic.'
          )
          this.store.setClassroomStatus('ended')
          this.stopMic()
          return
        }
        if (this.aborted(epoch)) return
        this.segCache.set(ti, segments)
      }

      // Starting a topic fresh — reset the running board to just the title.
      if (this.cursor.segmentIndex === 0) {
        this.board = { title: topic.title, explanation: '', keyPoints: [], examples: [], equations: [] }
        this.commitBoard()
      }

      while (this.cursor.segmentIndex < segments.length) {
        if (this.aborted(epoch)) return
        const seg = segments[this.cursor.segmentIndex]

        // Write the board delta first, then narrate — the board leads slightly,
        // like a lecturer writing a line and then explaining it.
        this.applyDelta(seg.board)
        this.commitBoard()

        // Advance the cursor BEFORE speaking so an interruption resumes on the
        // NEXT beat (never replays this beat's board delta).
        this.cursor.segmentIndex++

        if (seg.say) {
          this.push('instructor', seg.say, ti)
          await speakAsync(seg.say)
        }
        if (this.aborted(epoch)) return
      }

      // Topic finished — cache the completed board on the topic and move on.
      this.store.updateActiveLessonTopic(topic.id, {
        status: 'completed',
        whiteboard: {
          title: this.board.title,
          explanation: this.board.explanation,
          keyPoints: [...this.board.keyPoints],
          examples: [...this.board.examples],
          equations: this.board.equations ? [...this.board.equations] : [],
        },
      })
      this.cursor.topicIndex++
      this.cursor.segmentIndex = 0
    }

    // ── Class complete ────────────────────────────────────────────────────────
    if (this.aborted(epoch)) return
    this.store.setClassroomStatus('ended')
    this.stopMic()
    this.endSessionRecord()
    const closing =
      "That's the end of today's class. Great work. When you're ready, you can generate notes, flashcards, or a quiz from this lesson."
    this.push('instructor', closing)
    await speakAsync(closing)
  }

  // ── Interruption ────────────────────────────────────────────────────────────
  // Student raised their hand (button). Freeze the lecture and wait for a question.
  interrupt(): void {
    const status = this.store.classroomStatus
    if (status !== 'teaching') return
    this.paused = true
    cancelSpeech()
    this.store.setClassroomStatus('awaiting_question')
    this.push('system', 'You raised your hand. Ask your question and the instructor will pause to answer.')
  }

  // Student asked a question (typed, or spoken while awaiting). Answer, then resume.
  async submitQuestion(text: string): Promise<void> {
    const q = text.trim()
    const lesson = this.store.activeLesson
    if (!q || !lesson) return

    // If they spoke while the lecture was still running, pause it now.
    if (this.store.classroomStatus === 'teaching') {
      this.paused = true
      cancelSpeech()
    }

    this.push('student', q)
    this.store.setClassroomStatus('responding')
    this.stopMic()

    // New epoch so any lingering teaching loop bails out cleanly.
    const epoch = ++this.epoch
    try {
      const { say } = await interact({
        lesson,
        topicIndex: this.store.currentTopicIndex,
        whiteboard: this.store.whiteboard,
        action: 'ask_question',
        message: q,
        history: this.store.classroomMessages.map((m) => ({ role: m.role, content: m.content })).slice(-16),
      })
      if (epoch !== this.epoch) return
      this.push('instructor', say, this.store.currentTopicIndex)
      await speakAsync(say)
      if (epoch !== this.epoch) return
    } catch (err) {
      this.push('system', err instanceof Error ? err.message : 'I could not answer that just now.')
    }

    await this.resume()
  }

  // Resume the lecture from where it paused (no question asked, or after answering).
  async resume(): Promise<void> {
    if (!this.store.activeLesson) return
    if (this.store.classroomStatus === 'ended' || this.store.classroomStatus === 'idle') return

    this.paused = false
    const epoch = ++this.epoch
    this.store.setClassroomStatus('teaching')
    this.push('instructor', "Great — let's continue where we left off.")
    // Re-narrate the current board state briefly so the resume feels natural.
    this.startMicIfWanted()
    await this.loop(epoch)
  }

  // End the class immediately.
  async endClass(): Promise<void> {
    this.paused = true
    this.epoch++
    cancelSpeech()
    this.stopMic()
    if (this.store.classroomStatus === 'idle') return
    this.store.setClassroomStatus('ended')
    this.endSessionRecord()
    this.push('system', 'Class ended. You can generate notes, flashcards, or a quiz from this lesson.')
  }

  // ── Microphone (voice interruption) ─────────────────────────────────────────
  setMicEnabled(enabled: boolean): void {
    this.micWanted = enabled
    this.store.setClassroomVoice({ micActive: enabled })
    if (enabled) {
      this.startMicIfWanted()
    } else {
      this.stopMic()
    }
  }

  private startMicIfWanted(): void {
    if (!this.micWanted) return
    if (!this.recognizer) {
      this.recognizer = createRecognizer((transcript) => this.onSpeech(transcript))
      if (!this.recognizer) {
        // Recognition unsupported — reflect that back so the UI can disable it.
        this.micWanted = false
        this.store.setClassroomVoice({ micActive: false })
        return
      }
    }
    this.recognizer.start()
  }

  private stopMic(): void {
    this.recognizer?.stop()
  }

  private onSpeech(transcript: string): void {
    const status = this.store.classroomStatus
    if (status === 'teaching') {
      // While the instructor is speaking, only a wake phrase interrupts (keeps
      // the AI's own narration from falsely triggering an interruption).
      if (WAKE_RE.test(transcript)) this.interrupt()
    } else if (status === 'awaiting_question') {
      // Lecture is paused and silent — treat the whole utterance as the question.
      void this.submitQuestion(transcript)
    }
  }

  // ── Session bookkeeping ─────────────────────────────────────────────────────
  private syncSession(topicIndex: number) {
    const lesson = this.store.activeLesson
    if (!lesson) return
    const active = this.store.classroomSessions.find((ss) => ss.lesson_id === lesson.id && !ss.ended_at)
    if (active) {
      this.store.updateClassroomSession(active.id, {
        current_topic_index: topicIndex,
        status: 'teaching',
      })
    }
  }

  private endSessionRecord() {
    const lesson = this.store.activeLesson
    if (!lesson) return
    const active = this.store.classroomSessions.find((ss) => ss.lesson_id === lesson.id && !ss.ended_at)
    if (active) {
      this.store.updateClassroomSession(active.id, {
        status: 'ended',
        ended_at: new Date().toISOString(),
        current_topic_index: this.store.currentTopicIndex,
      })
    }
  }

  // Fully stop everything (used on unmount / leaving the classroom).
  destroy(): void {
    this.paused = true
    this.epoch++
    cancelSpeech()
    this.stopMic()
  }
}

// Module-level singleton — the class outlives component remounts.
export const classroomDirector = new ClassroomDirector()

// Mount once inside the Classroom workspace to guarantee cleanup on exit.
export function useClassroomDirector(): void {
  useEffect(() => {
    warmUpVoices()
    return () => classroomDirector.destroy()
  }, [])
}

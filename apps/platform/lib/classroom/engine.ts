'use client'

import type {
  Lesson,
  LessonTopic,
  WhiteboardContent,
  WhiteboardDelta,
  LectureSegment,
  Flashcard,
  QuizQuestion,
  StudentActionId,
} from '@zequel/types'

// Client-side lecture engine. Wraps the /api/classroom endpoint and normalizes
// the model's JSON into the app's typed shapes. Kept separate from UI so future
// transports (streaming, voice) can be added without touching components.

function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

interface ClassroomResponse {
  intent: string
  data: unknown
}

async function post(body: Record<string, unknown>): Promise<ClassroomResponse> {
  const res = await fetch('/api/classroom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      (payload as { error?: string }).error || 'The classroom request failed. Please try again.'
    throw new Error(message)
  }
  return payload as ClassroomResponse
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
}

function normalizeWhiteboard(raw: unknown, fallbackTitle: string): WhiteboardContent {
  const o = (raw ?? {}) as Record<string, unknown>
  return {
    title: asString(o.title, fallbackTitle),
    explanation: asString(o.explanation),
    keyPoints: asStringArray(o.keyPoints),
    examples: asStringArray(o.examples),
    equations: asStringArray(o.equations),
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface OutlineResult {
  title: string
  description: string
  topics: LessonTopic[]
}

export async function generateOutline(
  documentIds: string[],
  documentTitles: string[]
): Promise<Lesson> {
  const { data } = await post({ intent: 'outline', document_ids: documentIds })
  const o = (data ?? {}) as Record<string, unknown>

  const rawTopics = Array.isArray(o.topics) ? o.topics : []
  const topics: LessonTopic[] = rawTopics.map((t, i) => {
    const obj = (t ?? {}) as Record<string, unknown>
    return {
      id: asString(obj.id, `t${i + 1}`),
      title: asString(obj.title, `Topic ${i + 1}`),
      summary: asString(obj.summary),
      status: 'pending',
      whiteboard: null,
    }
  })

  return {
    id: uid(),
    title: asString(o.title, documentTitles[0] || 'Untitled Lesson'),
    description: asString(o.description),
    source_document_ids: documentIds,
    source_document_titles: documentTitles,
    outline: topics,
    created_at: new Date().toISOString(),
  }
}

export interface TeachResult {
  whiteboard: WhiteboardContent
  say: string
}

export async function teachTopic(params: {
  lesson: Lesson
  topicIndex: number
}): Promise<TeachResult> {
  const { lesson, topicIndex } = params
  const topic = lesson.outline[topicIndex]
  const { data } = await post({
    intent: 'teach',
    document_ids: lesson.source_document_ids,
    lesson_title: lesson.title,
    lesson_description: lesson.description,
    outline: lesson.outline.map((t) => ({ id: t.id, title: t.title, summary: t.summary })),
    topic_index: topicIndex,
    topic_title: topic?.title,
    topic_summary: topic?.summary,
  })

  const o = (data ?? {}) as Record<string, unknown>
  return {
    whiteboard: normalizeWhiteboard(o.whiteboard, topic?.title || lesson.title),
    say: asString(o.say, 'Let us begin.'),
  }
}

// ── Autonomous lecture (Classroom Director) ────────────────────────────────

function normalizeDelta(raw: unknown): WhiteboardDelta | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const delta: WhiteboardDelta = {}
  const title = asString(o.title).trim()
  const explanation = asString(o.explanation).trim()
  const keyPoints = asStringArray(o.keyPoints)
  const examples = asStringArray(o.examples)
  const equations = asStringArray(o.equations)
  if (title) delta.title = title
  if (explanation) delta.explanation = explanation
  if (keyPoints.length) delta.keyPoints = keyPoints
  if (examples.length) delta.examples = examples
  if (equations.length) delta.equations = equations
  return Object.keys(delta).length ? delta : undefined
}

export interface LectureResult {
  segments: LectureSegment[]
}

// Fetch the segmented lecture script for a single topic. The Director plays the
// returned segments one at a time (write board delta, then speak).
export async function generateLecture(params: {
  lesson: Lesson
  topicIndex: number
}): Promise<LectureResult> {
  const { lesson, topicIndex } = params
  const topic = lesson.outline[topicIndex]
  const { data } = await post({
    intent: 'lecture',
    document_ids: lesson.source_document_ids,
    lesson_title: lesson.title,
    lesson_description: lesson.description,
    outline: lesson.outline.map((t) => ({ id: t.id, title: t.title, summary: t.summary })),
    topic_index: topicIndex,
    topic_title: topic?.title,
    topic_summary: topic?.summary,
  })

  const o = (data ?? {}) as Record<string, unknown>
  const raw = Array.isArray(o.segments) ? o.segments : []
  const segments: LectureSegment[] = raw
    .map((seg): LectureSegment | null => {
      const obj = (seg ?? {}) as Record<string, unknown>
      const say = asString(obj.say).trim()
      const board = normalizeDelta(obj.board)
      if (!say && !board) return null
      return { say, board }
    })
    .filter((s): s is LectureSegment => s !== null)

  // Guarantee at least a minimal beat so the class never stalls on a bad reply.
  if (segments.length === 0) {
    segments.push({
      say: `Let's look at ${topic?.title ?? 'this topic'}.`,
      board: { title: topic?.title ?? lesson.title, explanation: topic?.summary ?? '' },
    })
  }

  return { segments }
}

export interface InteractResult {
  say: string
  whiteboard: WhiteboardContent | null
}

export async function interact(params: {
  lesson: Lesson
  topicIndex: number
  whiteboard: WhiteboardContent | null
  action: StudentActionId | null
  message: string | null
  history: Array<{ role: 'student' | 'instructor' | 'system'; content: string }>
}): Promise<InteractResult> {
  const { lesson, topicIndex, whiteboard, action, message, history } = params
  const topic = lesson.outline[topicIndex]
  const { data } = await post({
    intent: 'interact',
    document_ids: lesson.source_document_ids,
    lesson_title: lesson.title,
    outline: lesson.outline.map((t) => ({ id: t.id, title: t.title, summary: t.summary })),
    topic_index: topicIndex,
    topic_title: topic?.title,
    topic_summary: topic?.summary,
    whiteboard,
    student_action: action,
    student_message: message,
    history: history.slice(-16),
  })

  const o = (data ?? {}) as Record<string, unknown>
  const hasBoard = o.whiteboard && typeof o.whiteboard === 'object'
  return {
    say: asString(o.say, 'Let us continue.'),
    whiteboard: hasBoard ? normalizeWhiteboard(o.whiteboard, topic?.title || lesson.title) : null,
  }
}

export async function generateMarkdown(
  intent: 'summary' | 'notes',
  lesson: Lesson
): Promise<string> {
  const { data } = await post({
    intent,
    document_ids: lesson.source_document_ids,
    lesson_title: lesson.title,
    lesson_description: lesson.description,
    outline: lesson.outline.map((t) => ({ id: t.id, title: t.title, summary: t.summary })),
  })
  const o = (data ?? {}) as Record<string, unknown>
  return asString(o.content, '')
}

export async function generateFlashcards(lesson: Lesson): Promise<Flashcard[]> {
  const { data } = await post({
    intent: 'flashcards',
    document_ids: lesson.source_document_ids,
    lesson_title: lesson.title,
    lesson_description: lesson.description,
    outline: lesson.outline.map((t) => ({ id: t.id, title: t.title, summary: t.summary })),
  })
  const o = (data ?? {}) as Record<string, unknown>
  const raw = Array.isArray(o.cards) ? o.cards : []
  return raw
    .map((c) => {
      const obj = (c ?? {}) as Record<string, unknown>
      return { id: uid(), front: asString(obj.front), back: asString(obj.back) }
    })
    .filter((c) => c.front && c.back)
}

export async function generateQuiz(lesson: Lesson): Promise<QuizQuestion[]> {
  const { data } = await post({
    intent: 'quiz',
    document_ids: lesson.source_document_ids,
    lesson_title: lesson.title,
    lesson_description: lesson.description,
    outline: lesson.outline.map((t) => ({ id: t.id, title: t.title, summary: t.summary })),
  })
  const o = (data ?? {}) as Record<string, unknown>
  const raw = Array.isArray(o.questions) ? o.questions : []
  return raw
    .map((q) => {
      const obj = (q ?? {}) as Record<string, unknown>
      const options = asStringArray(obj.options)
      const answerIndex = Number(obj.answer_index)
      return {
        id: uid(),
        question: asString(obj.question),
        options,
        answer_index: Number.isFinite(answerIndex) && answerIndex >= 0 && answerIndex < options.length ? answerIndex : 0,
        explanation: asString(obj.explanation),
      }
    })
    .filter((q) => q.question && q.options.length >= 2)
}

'use client'

import { useCallback } from 'react'
import { useWorkspaceStore } from '@/lib/store'
import { useToast } from '@zequel/ui/hooks/use-toast'
import {
  generateOutline,
  teachTopic,
  interact,
  generateMarkdown,
  generateFlashcards,
  generateQuiz,
} from '@/lib/classroom/engine'
import type {
  ClassroomMessage,
  ClassroomMessageRole,
  StudentActionId,
} from '@zequel/types'

function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

// Central orchestration for Classroom Mode. Wraps the lecture engine and keeps
// the Zustand store in sync so any panel (board toolbar, chat, mobile tabs) can
// trigger the same teaching actions without prop drilling. All reads use
// getState() so callbacks never close over stale state.
export function useClassroom() {
  const { toast } = useToast()

  const pushMessage = useCallback(
    (role: ClassroomMessageRole, content: string, topicIndex?: number) => {
      const msg: ClassroomMessage = {
        id: uid(),
        role,
        content,
        created_at: new Date().toISOString(),
        topic_index: topicIndex,
      }
      useWorkspaceStore.getState().addClassroomMessage(msg)
      return msg
    },
    []
  )

  const fail = useCallback(
    (message: string) => {
      toast({ title: 'Classroom', description: message, variant: 'destructive' })
      pushMessage('system', message)
    },
    [toast, pushMessage]
  )

  // ── Build a lesson from the selected uploaded materials ─────────────────────
  const buildLesson = useCallback(async () => {
    const s = useWorkspaceStore.getState()
    if (s.isClassroomBusy) return
    const ids = s.selectedDocumentIds
    if (ids.length === 0) {
      toast({
        title: 'Select materials',
        description: 'Choose at least one uploaded material to build a lesson.',
      })
      s.setClassroomSection('materials')
      return
    }
    const titles = s.documents
      .filter((d) => ids.includes(d.id))
      .map((d) => d.title)

    s.setIsClassroomBusy(true)
    s.setClassroomStatus('analyzing')
    try {
      const lesson = await generateOutline(ids, titles)
      const st = useWorkspaceStore.getState()
      st.addLesson(lesson)
      st.setActiveLesson(lesson)
      st.setCurrentTopicIndex(0)
      st.setClassroomMessages([])
      st.setWhiteboard(null)
      st.setClassroomStatus('outline')
      st.setClassroomSection('lessons')
      pushMessage(
        'instructor',
        `I've prepared a lesson: "${lesson.title}". Review the outline, then press Start Lesson when you're ready.`
      )
    } catch (err) {
      useWorkspaceStore.getState().setClassroomStatus('idle')
      fail(err instanceof Error ? err.message : 'Could not build the lesson.')
    } finally {
      useWorkspaceStore.getState().setIsClassroomBusy(false)
    }
  }, [toast, pushMessage, fail])

  // Load a previously generated lesson back into the workspace.
  const loadLesson = useCallback((lessonId: string) => {
    const s = useWorkspaceStore.getState()
    const lesson = s.lessons.find((l) => l.id === lessonId)
    if (!lesson) return
    s.setActiveLesson(lesson)
    s.setCurrentTopicIndex(0)
    s.setClassroomMessages([])
    s.setWhiteboard(null)
    s.setClassroomStatus('outline')
  }, [])

  // ── Teach a specific topic index ────────────────────────────────────────────
  const teachIndex = useCallback(
    async (index: number, opts: { silent?: boolean } = {}) => {
      const s = useWorkspaceStore.getState()
      const lesson = s.activeLesson
      if (!lesson || s.isClassroomBusy) return
      if (index < 0 || index >= lesson.outline.length) return

      s.setIsClassroomBusy(true)
      s.setClassroomStatus('teaching')
      s.setCurrentTopicIndex(index)

      // Mark topic statuses.
      lesson.outline.forEach((t, i) => {
        s.updateActiveLessonTopic(t.id, {
          status: i < index ? 'completed' : i === index ? 'active' : 'pending',
        })
      })

      try {
        const { whiteboard, say } = await teachTopic({ lesson, topicIndex: index })
        const st = useWorkspaceStore.getState()
        st.setWhiteboard(whiteboard)
        st.updateActiveLessonTopic(lesson.outline[index].id, { whiteboard })
        if (!opts.silent) pushMessage('instructor', say, index)
        // Track/refresh session progress.
        const active = st.classroomSessions.find(
          (ss) => ss.lesson_id === lesson.id && !ss.ended_at
        )
        if (active) {
          st.updateClassroomSession(active.id, {
            current_topic_index: index,
            status: 'teaching',
          })
        }
      } catch (err) {
        useWorkspaceStore.getState().setClassroomStatus('teaching')
        fail(err instanceof Error ? err.message : 'Could not teach this topic.')
      } finally {
        useWorkspaceStore.getState().setIsClassroomBusy(false)
      }
    },
    [pushMessage, fail]
  )

  // ── Instructor toolbar controls ─────────────────────────────────────────────
  const startLesson = useCallback(() => {
    const s = useWorkspaceStore.getState()
    const lesson = s.activeLesson
    if (!lesson) return
    // Open a session in history.
    const existing = s.classroomSessions.find(
      (ss) => ss.lesson_id === lesson.id && !ss.ended_at
    )
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
    void teachIndex(0)
  }, [teachIndex])

  const pauseLesson = useCallback(() => {
    const s = useWorkspaceStore.getState()
    if (s.classroomStatus !== 'teaching') return
    s.setClassroomStatus('paused')
    pushMessage('system', 'Lesson paused.')
  }, [pushMessage])

  const resumeLesson = useCallback(() => {
    const s = useWorkspaceStore.getState()
    if (s.classroomStatus !== 'paused') return
    s.setClassroomStatus('teaching')
    pushMessage('system', 'Lesson resumed.')
  }, [pushMessage])

  const nextTopic = useCallback(() => {
    const s = useWorkspaceStore.getState()
    if (!s.activeLesson) return
    const next = s.currentTopicIndex + 1
    if (next >= s.activeLesson.outline.length) {
      toast({ title: 'Classroom', description: 'You have reached the last topic.' })
      return
    }
    void teachIndex(next)
  }, [teachIndex, toast])

  const previousTopic = useCallback(() => {
    const s = useWorkspaceStore.getState()
    if (!s.activeLesson) return
    const prev = s.currentTopicIndex - 1
    if (prev < 0) {
      toast({ title: 'Classroom', description: 'You are at the first topic.' })
      return
    }
    void teachIndex(prev)
  }, [teachIndex, toast])

  const repeatTopic = useCallback(() => {
    const s = useWorkspaceStore.getState()
    if (!s.activeLesson) return
    void teachIndex(s.currentTopicIndex)
  }, [teachIndex])

  const endSession = useCallback(() => {
    const s = useWorkspaceStore.getState()
    const lesson = s.activeLesson
    s.setClassroomStatus('ended')
    if (lesson) {
      const active = s.classroomSessions.find(
        (ss) => ss.lesson_id === lesson.id && !ss.ended_at
      )
      if (active) {
        s.updateClassroomSession(active.id, {
          status: 'ended',
          ended_at: new Date().toISOString(),
          current_topic_index: s.currentTopicIndex,
        })
      }
    }
    pushMessage('system', 'Session ended. You can generate a summary, notes, flashcards, or a quiz.')
  }, [pushMessage])

  // ── Student interaction ─────────────────────────────────────────────────────
  const runInteraction = useCallback(
    async (action: StudentActionId | null, message: string | null) => {
      const s = useWorkspaceStore.getState()
      const lesson = s.activeLesson
      if (!lesson || s.isClassroomBusy) return

      s.setIsClassroomBusy(true)
      try {
        const { say, whiteboard } = await interact({
          lesson,
          topicIndex: s.currentTopicIndex,
          whiteboard: s.whiteboard,
          action,
          message,
          history: useWorkspaceStore
            .getState()
            .classroomMessages.map((m) => ({ role: m.role, content: m.content })),
        })
        const st = useWorkspaceStore.getState()
        if (whiteboard) {
          st.setWhiteboard(whiteboard)
          const topic = lesson.outline[st.currentTopicIndex]
          if (topic) st.updateActiveLessonTopic(topic.id, { whiteboard })
        }
        pushMessage('instructor', say, st.currentTopicIndex)
        if (action === 'end_session') endSession()
      } catch (err) {
        fail(err instanceof Error ? err.message : 'The instructor could not respond.')
      } finally {
        useWorkspaceStore.getState().setIsClassroomBusy(false)
      }
    },
    [pushMessage, fail, endSession]
  )

  const askQuestion = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      pushMessage('student', trimmed)
      void runInteraction(null, trimmed)
    },
    [pushMessage, runInteraction]
  )

  const studentAction = useCallback(
    (action: StudentActionId, label: string) => {
      if (action === 'skip_topic') {
        pushMessage('student', label)
        nextTopic()
        return
      }
      pushMessage('student', label)
      void runInteraction(action, null)
    },
    [pushMessage, runInteraction, nextTopic]
  )

  // ── Artifact generation ─────────────────────────────────────────────────────
  const generate = useCallback(
    async (kind: 'summary' | 'notes' | 'flashcards' | 'quiz') => {
      const s = useWorkspaceStore.getState()
      const lesson = s.activeLesson
      if (!lesson || s.isClassroomBusy) {
        if (!lesson) toast({ title: 'Classroom', description: 'Load a lesson first.' })
        return
      }
      s.setIsClassroomBusy(true)
      try {
        if (kind === 'summary' || kind === 'notes') {
          const content = await generateMarkdown(kind, lesson)
          if (!content) throw new Error('Empty response.')
          useWorkspaceStore.getState().addGeneratedNote({
            id: uid(),
            lesson_id: lesson.id,
            lesson_title: `${lesson.title}${kind === 'summary' ? ' — Summary' : ' — Notes'}`,
            content,
            created_at: new Date().toISOString(),
          })
          const st = useWorkspaceStore.getState()
          st.setClassroomSection('notes')
          toast({ title: 'Classroom', description: `${kind === 'summary' ? 'Summary' : 'Notes'} generated.` })
        } else if (kind === 'flashcards') {
          const cards = await generateFlashcards(lesson)
          if (cards.length === 0) throw new Error('No flashcards were produced.')
          useWorkspaceStore.getState().addFlashcardDeck({
            id: uid(),
            lesson_id: lesson.id,
            lesson_title: lesson.title,
            cards,
            created_at: new Date().toISOString(),
          })
          useWorkspaceStore.getState().setClassroomSection('flashcards')
          toast({ title: 'Classroom', description: `${cards.length} flashcards generated.` })
        } else {
          const questions = await generateQuiz(lesson)
          if (questions.length === 0) throw new Error('No quiz questions were produced.')
          useWorkspaceStore.getState().addQuiz({
            id: uid(),
            lesson_id: lesson.id,
            lesson_title: lesson.title,
            questions,
            created_at: new Date().toISOString(),
          })
          useWorkspaceStore.getState().setClassroomSection('quizzes')
          toast({ title: 'Classroom', description: `${questions.length}-question quiz generated.` })
        }
      } catch (err) {
        fail(err instanceof Error ? err.message : 'Generation failed.')
      } finally {
        useWorkspaceStore.getState().setIsClassroomBusy(false)
      }
    },
    [toast, fail]
  )

  return {
    buildLesson,
    loadLesson,
    startLesson,
    pauseLesson,
    resumeLesson,
    nextTopic,
    previousTopic,
    repeatTopic,
    endSession,
    teachIndex,
    askQuestion,
    studentAction,
    generate,
  }
}

export type ClassroomActions = ReturnType<typeof useClassroom>

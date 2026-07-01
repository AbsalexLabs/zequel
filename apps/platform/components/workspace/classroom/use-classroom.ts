'use client'

import { useCallback } from 'react'
import { useWorkspaceStore } from '@/lib/store'
import { useToast } from '@zequel/ui/hooks/use-toast'
import { classroomDirector } from '@/lib/classroom/director'
import {
  generateOutline,
  generateMarkdown,
  generateFlashcards,
  generateQuiz,
} from '@/lib/classroom/engine'
import type { ClassroomMessage, ClassroomMessageRole } from '@zequel/types'

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
        `I've prepared a lesson: "${lesson.title}". Press Start AI Class and I'll teach it to you.`
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

  // ── Autonomous class controls (delegated to the Director) ───────────────────
  // The Director owns the teaching loop: it decides when to speak, write the
  // board, pause for a question, and resume. The hook just forwards intent.

  // Start (or restart) the whole class from the beginning — hands-off.
  const startClass = useCallback(() => {
    const s = useWorkspaceStore.getState()
    if (!s.activeLesson) return
    void classroomDirector.startClass()
  }, [])

  // Student raised their hand (button). Freeze the lecture, wait for a question.
  const raiseHand = useCallback(() => {
    classroomDirector.interrupt()
  }, [])

  // Student asked a question (typed or spoken). The Director answers, then resumes.
  const askQuestion = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    void classroomDirector.submitQuestion(trimmed)
  }, [])

  // Resume the lecture from where it paused (used to dismiss a raised hand).
  const resumeClass = useCallback(() => {
    void classroomDirector.resume()
  }, [])

  // End the class immediately.
  const endSession = useCallback(() => {
    void classroomDirector.endClass()
  }, [])

  // Toggle the live microphone (voice interruption where supported).
  const setMicEnabled = useCallback((enabled: boolean) => {
    classroomDirector.setMicEnabled(enabled)
  }, [])

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
    startClass,
    raiseHand,
    resumeClass,
    askQuestion,
    endSession,
    setMicEnabled,
    generate,
  }
}

export type ClassroomActions = ReturnType<typeof useClassroom>

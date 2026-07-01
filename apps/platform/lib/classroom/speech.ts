'use client'

import { useEffect, useRef } from 'react'
import { useWorkspaceStore } from '@/lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Voice-first narration for Classroom Mode.
//
// This is the first real implementation of the AI lecturer's voice. It uses the
// browser's built-in Web Speech API (SpeechSynthesis) so the instructor actually
// speaks the explanation aloud while the whiteboard is written. It is designed
// to be swapped for a higher-quality streaming TTS engine later without changing
// any of the UI — the voice bar and store state stay identical.
// ─────────────────────────────────────────────────────────────────────────────

function getSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

export function isSpeechSupported(): boolean {
  return getSynth() !== null && typeof window.SpeechSynthesisUtterance !== 'undefined'
}

let cachedVoice: SpeechSynthesisVoice | null = null

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const voices = synth.getVoices()
  if (voices.length === 0) return null
  // Prefer a natural-sounding English voice, then any English voice, then default.
  const preferred =
    voices.find((v) => /en(-|_)?(US|GB)/i.test(v.lang) && /natural|google|samantha|daniel/i.test(v.name)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    voices.find((v) => v.default) ??
    voices[0]
  cachedVoice = preferred ?? null
  return cachedVoice
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// Strip markdown / whiteboard syntax so the spoken text sounds natural.
function stripForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|-]+/g, ' ')
    .replace(/\$\$([^$]*)\$\$/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// Speak a piece of text using the current voice settings from the store.
export function speak(text: string): void {
  const synth = getSynth()
  if (!synth) return
  const clean = stripForSpeech(text)
  if (!clean) return

  const voice = useWorkspaceStore.getState().classroomVoice
  if (voice.muted) return

  // Cancel any in-flight utterance so a new explanation takes over cleanly.
  synth.cancel()

  const u = new SpeechSynthesisUtterance(clean)
  u.rate = clamp(voice.speed, 0.5, 2)
  u.volume = clamp(voice.volume / 100, 0, 1)
  u.pitch = 1
  const v = pickVoice(synth)
  if (v) {
    u.voice = v
    u.lang = v.lang
  }
  u.onstart = () => useWorkspaceStore.getState().setClassroomVoice({ playing: true })
  u.onend = () => useWorkspaceStore.getState().setClassroomVoice({ playing: false })
  u.onerror = () => useWorkspaceStore.getState().setClassroomVoice({ playing: false })
  synth.speak(u)
}

export function cancelSpeech(): void {
  const synth = getSynth()
  if (!synth) return
  synth.cancel()
  useWorkspaceStore.getState().setClassroomVoice({ playing: false })
}

export function pauseSpeech(): void {
  const synth = getSynth()
  if (!synth) return
  if (synth.speaking && !synth.paused) synth.pause()
}

export function resumeSpeech(): void {
  const synth = getSynth()
  if (!synth) return
  if (synth.paused) synth.resume()
}

// Re-speak the most recent instructor explanation (drives the "Replay" control).
export function replayLastExplanation(): void {
  const s = useWorkspaceStore.getState()
  const last = [...s.classroomMessages].reverse().find((m) => m.role === 'instructor')
  if (last) speak(last.content)
}

// ─────────────────────────────────────────────────────────────────────────────
// React controller — mount once inside the Classroom workspace. It watches the
// conversation + voice/lesson state and drives the speech engine accordingly.
// ─────────────────────────────────────────────────────────────────────────────
export function useLectureVoice(): void {
  const messages = useWorkspaceStore((s) => s.classroomMessages)
  const status = useWorkspaceStore((s) => s.classroomStatus)
  const muted = useWorkspaceStore((s) => s.classroomVoice.muted)
  const micActive = useWorkspaceStore((s) => s.classroomVoice.micActive)

  const lastSpokenId = useRef<string | null>(null)
  const didInit = useRef(false)

  // Warm up the voice list (voices load asynchronously in most browsers).
  useEffect(() => {
    const synth = getSynth()
    if (!synth) return
    const load = () => pickVoice(synth)
    load()
    synth.addEventListener?.('voiceschanged', load)
    return () => synth.removeEventListener?.('voiceschanged', load)
  }, [])

  // Speak each NEW instructor message as it arrives. On first mount we only
  // record the latest message id so pre-existing history isn't read aloud.
  useEffect(() => {
    if (!isSpeechSupported()) return
    const latestInstructor = [...messages].reverse().find((m) => m.role === 'instructor')
    if (!latestInstructor) return

    if (!didInit.current) {
      didInit.current = true
      lastSpokenId.current = latestInstructor.id
      return
    }
    if (lastSpokenId.current === latestInstructor.id) return
    lastSpokenId.current = latestInstructor.id
    if (muted) return
    speak(latestInstructor.content)
  }, [messages, muted])

  // Pause narration when the lesson is paused or the student takes the mic to
  // interrupt; resume when teaching continues. This models the voice-first
  // "interrupt the lecturer" flow described in the product spec.
  useEffect(() => {
    if (status === 'paused' || micActive) {
      pauseSpeech()
    } else if (status === 'teaching') {
      resumeSpeech()
    }
  }, [status, micActive])

  // Muting immediately silences the instructor.
  useEffect(() => {
    if (muted) cancelSpeech()
  }, [muted])

  // Stop any narration when leaving the classroom.
  useEffect(() => () => cancelSpeech(), [])
}

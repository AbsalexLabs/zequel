'use client'

import { useWorkspaceStore } from '@/lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Voice engine for Classroom Mode.
//
// This is an IMPERATIVE engine driven by the Classroom Director (not a reactive
// hook): the Director awaits `speakAsync(text)` for each spoken beat so it can
// keep the whiteboard in perfect step with the narration and stop instantly when
// the student interrupts.
//
// Voice source:
//   1. Preferred — natural AI voice via /api/classroom/tts (OpenAI). Returns
//      audio/mpeg which we play through a single <audio> element.
//   2. Fallback — the browser's built-in Web Speech (SpeechSynthesis) when no
//      TTS key is configured or a request fails.
//
// It also exposes a small speech-recognition helper so the student can interrupt
// the lecture with their voice ("excuse me…") where the browser supports it.
// ─────────────────────────────────────────────────────────────────────────────

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// Strip markdown / board syntax so the spoken text sounds natural.
function stripForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|]+/g, ' ')
    .replace(/\$\$([^$]*)\$\$/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Playback state ───────────────────────────────────────────────────────────
// A monotonically increasing epoch lets us cancel in-flight speech: any pending
// async work checks that its epoch still matches before continuing.
let speakEpoch = 0
let currentAudio: HTMLAudioElement | null = null
let activeResolve: (() => void) | null = null
// null = unknown, true = AI TTS works, false = fell back to browser voice.
let ttsAvailable: boolean | null = null

function setPlaying(playing: boolean) {
  useWorkspaceStore.getState().setClassroomVoice({ playing })
}

function finish() {
  if (activeResolve) {
    const r = activeResolve
    activeResolve = null
    r()
  }
}

// Stop any narration immediately and resolve the pending speak promise.
export function cancelSpeech(): void {
  speakEpoch++
  if (currentAudio) {
    try {
      currentAudio.pause()
    } catch {
      /* ignore */
    }
    currentAudio.src = ''
    currentAudio = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
  }
  setPlaying(false)
  finish()
}

// ── Browser (Web Speech) fallback ─────────────────────────────────────────────
let cachedVoice: SpeechSynthesisVoice | null = null

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const voices = synth.getVoices()
  if (voices.length === 0) return null
  const preferred =
    voices.find(
      (v) => /en(-|_)?(US|GB)/i.test(v.lang) && /natural|google|samantha|daniel/i.test(v.name)
    ) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    voices.find((v) => v.default) ??
    voices[0]
  cachedVoice = preferred ?? null
  return cachedVoice
}

function speakWithBrowser(text: string, epoch: number, speed: number, volume: number): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  const synth = window.speechSynthesis
  const u = new SpeechSynthesisUtterance(text)
  u.rate = clamp(speed, 0.5, 2)
  u.volume = clamp(volume / 100, 0, 1)
  u.pitch = 1
  const v = pickVoice(synth)
  if (v) {
    u.voice = v
    u.lang = v.lang
  }
  u.onend = () => {
    if (epoch === speakEpoch) {
      setPlaying(false)
      finish()
    }
  }
  u.onerror = () => {
    if (epoch === speakEpoch) {
      setPlaying(false)
      finish()
    }
  }
  try {
    synth.speak(u)
    return true
  } catch {
    return false
  }
}

// ── AI TTS ─────────────────────────────────────────────────────────────────
// Returns true if it handled playback (either played, or was cancelled mid-fetch);
// false means the caller should fall back to the browser voice.
async function speakWithAI(
  text: string,
  epoch: number,
  speed: number,
  volume: number
): Promise<boolean> {
  if (ttsAvailable === false) return false
  try {
    const res = await fetch('/api/classroom/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speed }),
    })

    // 501 = not configured; any non-ok = fall back to the browser voice.
    if (res.status === 501) {
      ttsAvailable = false
      return false
    }
    if (!res.ok) return false

    ttsAvailable = true
    const blob = await res.blob()

    // Cancelled while we were fetching — nothing to play (resolve already fired).
    if (epoch !== speakEpoch) return true

    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio
    audio.volume = clamp(volume / 100, 0, 1)
    const cleanup = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
    }
    audio.onended = () => {
      cleanup()
      if (epoch === speakEpoch) {
        setPlaying(false)
        finish()
      }
    }
    audio.onerror = () => {
      cleanup()
      if (epoch === speakEpoch) {
        // Let the caller know so it can try the browser voice next time.
        setPlaying(false)
        finish()
      }
    }
    try {
      await audio.play()
    } catch {
      cleanup()
      return false
    }
    return true
  } catch {
    return false
  }
}

// Speak a piece of text and resolve when it finishes (or is cancelled).
export function speakAsync(text: string): Promise<void> {
  const clean = stripForSpeech(text)
  const voice = useWorkspaceStore.getState().classroomVoice
  if (!clean || voice.muted) return Promise.resolve()

  // Stop anything currently playing (also resolves its promise) and take over.
  cancelSpeech()
  const myEpoch = speakEpoch
  setPlaying(true)

  return new Promise<void>((resolve) => {
    activeResolve = resolve
    void (async () => {
      const handled = await speakWithAI(clean, myEpoch, voice.speed, voice.volume)
      if (myEpoch !== speakEpoch) return // cancelled during fetch
      if (!handled) {
        const ok = speakWithBrowser(clean, myEpoch, voice.speed, voice.volume)
        if (!ok) {
          // No voice available at all — don't block the lecture.
          setPlaying(false)
          finish()
        }
      }
    })()
  })
}

// Warm up the browser voice list (voices load asynchronously).
export function warmUpVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const synth = window.speechSynthesis
  pickVoice(synth)
  synth.addEventListener?.('voiceschanged', () => pickVoice(synth))
}

// ── Speech recognition (student voice interruption) ──────────────────────────
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

export function isRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  )
}

export interface Recognizer {
  start: () => void
  stop: () => void
}

// Create a continuous recognizer. `onFinal` receives each finalized transcript.
export function createRecognizer(onFinal: (transcript: string) => void): Recognizer | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition
  if (!Ctor) return null

  const rec = new Ctor()
  rec.continuous = true
  rec.interimResults = false
  rec.lang = 'en-US'

  let want = false

  rec.onresult = (event) => {
    const results = event.results
    const last = results[results.length - 1]
    const transcript = last?.[0]?.transcript?.trim()
    if (transcript) onFinal(transcript)
  }
  rec.onerror = () => {
    /* transient errors are ignored; onend restarts if still wanted */
  }
  rec.onend = () => {
    if (want) {
      try {
        rec.start()
      } catch {
        /* ignore double-start */
      }
    }
  }

  return {
    start() {
      want = true
      try {
        rec.start()
      } catch {
        /* already started */
      }
    },
    stop() {
      want = false
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    },
  }
}

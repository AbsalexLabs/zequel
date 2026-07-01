import { createClient } from '@zequel/shared/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// Text-to-speech for the AI lecturer's voice.
//
// The Classroom Director calls this per spoken beat. If OPENAI_API_KEY is set we
// synthesize a natural voice with OpenAI's speech API and stream back audio/mpeg.
// If the key is missing we return 501 so the client transparently falls back to
// the browser's built-in Web Speech voice — the class still runs either way.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CHARS = 2000

function clampSpeed(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 1
  return Math.min(1.5, Math.max(0.5, v))
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    // Not configured — signal the client to use its browser-voice fallback.
    return new Response(JSON.stringify({ error: 'TTS not configured' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Require an authenticated user so the endpoint can't be abused anonymously.
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Auth unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: { text?: unknown; speed?: unknown; voice?: unknown }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_CHARS) : ''
  if (!text) {
    return new Response(JSON.stringify({ error: 'No text' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const voice = typeof body.voice === 'string' ? body.voice : 'alloy'

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        input: text,
        speed: clampSpeed(body.speed),
        response_format: 'mp3',
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[Zequel] TTS provider error:', res.status, detail.slice(0, 300))
      return new Response(JSON.stringify({ error: 'TTS failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const audio = await res.arrayBuffer()
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[Zequel] TTS route error:', error)
    return new Response(JSON.stringify({ error: 'TTS error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

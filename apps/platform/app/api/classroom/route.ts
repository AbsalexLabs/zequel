import { createClient } from '@zequel/shared/supabase/server'
import { processAIRequest, executeAICall } from '@/lib/ai/model-service'
import { validateRequest, classroomRequestSchema } from '@zequel/shared/validation/ai-schema'
import {
  CLASSROOM_SYSTEM_PROMPT,
  OUTLINE_INSTRUCTION,
  teachInstruction,
  interactInstruction,
  SUMMARY_INSTRUCTION,
  NOTES_INSTRUCTION,
  FLASHCARDS_INSTRUCTION,
  QUIZ_INSTRUCTION,
} from '@/lib/classroom/prompts'
import type { SystemSettings } from '@zequel/shared/settings/system-settings'

const MAX_DOC_CHARS = 40000

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '\n\n[...truncated...]' : text
}

// The model is asked to return raw JSON. Be tolerant of stray fences/prose by
// extracting the first balanced JSON object from the response.
function extractJson(raw: string): unknown {
  if (!raw) return null
  let text = raw.trim()
  // Strip ```json ... ``` fences if present.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()

  try {
    return JSON.parse(text)
  } catch {
    // Fall back to slicing from the first { to the last }.
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return json({ error: 'Database not configured' }, 503)
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return json({ error: 'AI service not configured' }, 503)
    }

    const body = await request.json()

    const validation = validateRequest(classroomRequestSchema, body)
    if (!validation.success) {
      return json({ error: (validation as { error: string }).error }, 400)
    }

    const {
      intent,
      document_ids,
      lesson_title,
      lesson_description,
      outline,
      topic_title,
      topic_summary,
      whiteboard,
      student_action,
      student_message,
      history,
    } = validation.data

    // Auth + rate limit + subscription + settings (skip built-in validation).
    const authResult = await processAIRequest('chat', body, { skipValidation: true })
    if (!authResult.success) {
      return json({ error: authResult.error }, authResult.statusCode || 401)
    }

    const { user, subscription, startTime, settings } = authResult.data as {
      user: { id: string }
      subscription: { plan: 'free' | 'premium_lite' | 'premium_pro' }
      startTime: number
      settings: SystemSettings
    }

    const supabase = await createClient()

    // ── Assemble context messages ─────────────────────────────────────────────
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: CLASSROOM_SYSTEM_PROMPT },
    ]

    // Course materials (uploaded documents) — the lesson source.
    const docIds = (document_ids as string[] | undefined) ?? []
    if (docIds.length > 0) {
      const { data: docs } = await supabase
        .from('documents')
        .select('id, title, extracted_text')
        .in('id', docIds)
        .eq('user_id', user.id)

      if (docs && docs.length > 0) {
        const blocks = docs
          .filter((d) => d.extracted_text)
          .map((d) => `[Material: ${d.title}]\n${truncate(d.extracted_text as string, MAX_DOC_CHARS)}`)
        if (blocks.length > 0) {
          messages.push({
            role: 'system',
            content: `The student uploaded the following course material(s). Treat them as the authoritative lesson source:\n\n---BEGIN MATERIALS---\n${blocks.join('\n\n---\n\n')}\n---END MATERIALS---`,
          })
        }
      }
    }

    // Lesson context (title + outline) for teaching/generation intents.
    if (lesson_title || outline) {
      const outlineText = (outline ?? [])
        .map((t, i) => `${i + 1}. ${t.title} — ${t.summary}`)
        .join('\n')
      messages.push({
        role: 'system',
        content: `Lesson: ${lesson_title ?? 'Untitled'}${
          lesson_description ? `\n${lesson_description}` : ''
        }${outlineText ? `\n\nOutline:\n${outlineText}` : ''}`,
      })
    }

    // Recent lecture transcript for continuity.
    if (history && history.length > 0) {
      for (const m of history) {
        const role = m.role === 'instructor' ? 'assistant' : m.role === 'student' ? 'user' : 'system'
        messages.push({ role, content: m.content })
      }
    }

    // Current whiteboard for interaction context.
    if ((intent === 'interact' || intent === 'teach') && whiteboard) {
      messages.push({
        role: 'system',
        content: `Current whiteboard state:\nTITLE: ${whiteboard.title}\nEXPLANATION: ${whiteboard.explanation}\nKEY POINTS: ${(whiteboard.keyPoints || []).join('; ')}\nEXAMPLES: ${(whiteboard.examples || []).join('; ')}`,
      })
    }

    // ── Per-intent instruction ────────────────────────────────────────────────
    let instruction: string
    switch (intent) {
      case 'outline':
        if (docIds.length === 0) {
          return json({ error: 'Select at least one uploaded material to build a lesson.' }, 400)
        }
        instruction = OUTLINE_INSTRUCTION
        break
      case 'teach':
        instruction = teachInstruction(topic_title ?? lesson_title ?? 'this topic', topic_summary ?? '')
        break
      case 'interact':
        instruction = interactInstruction({
          action: student_action ?? null,
          message: student_message ?? null,
          topicTitle: topic_title ?? lesson_title ?? 'this topic',
        })
        break
      case 'summary':
        instruction = SUMMARY_INSTRUCTION
        break
      case 'notes':
        instruction = NOTES_INSTRUCTION
        break
      case 'flashcards':
        instruction = FLASHCARDS_INSTRUCTION
        break
      case 'quiz':
        instruction = QUIZ_INSTRUCTION
        break
      default:
        return json({ error: 'Unknown intent' }, 400)
    }

    messages.push({ role: 'user', content: instruction })

    // ── Execute (non-streaming — we need a complete JSON payload) ─────────────
    const aiResult = await executeAICall(
      user.id,
      'chat',
      { messages, stream: false, feature: 'chat' },
      subscription.plan,
      startTime,
      settings
    )

    if (!aiResult.success) {
      const aiData = aiResult.data as { upgradeRequired?: boolean; requiredPlan?: string } | undefined
      return json(
        {
          error: aiResult.error || 'AI processing failed',
          upgradeRequired: aiData?.upgradeRequired ?? false,
          requiredPlan: aiData?.requiredPlan,
        },
        aiResult.statusCode || 502
      )
    }

    const result = aiResult.data as { choices?: Array<{ message?: { content?: string } }> }
    const content = result.choices?.[0]?.message?.content ?? ''
    const parsed = extractJson(content)

    if (!parsed) {
      return json({ error: 'The instructor response could not be parsed. Please try again.' }, 502)
    }

    return json({ intent, data: parsed }, 200)
  } catch (error) {
    console.error('[Zequel] Classroom API error:', error)
    return json(
      { error: 'Failed to process classroom request', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    )
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

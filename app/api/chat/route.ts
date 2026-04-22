import { createClient } from '@/lib/supabase/server'
import { processAIRequest, executeAICall, logStreamCompletion } from '@/lib/ai/model-service'
import { estimateTokens } from '@/lib/logging/ai-logger'
import type { SystemSettings } from '@/lib/settings/system-settings'

const STUDY_SYSTEM_PROMPT = `You are Zequel, a world-class AI research assistant and study companion created by Absalex Labs. You possess extraordinary intelligence, depth of knowledge, and analytical capability rivaling the best human experts in every field.

CORE IDENTITY & INTELLIGENCE:
- You reason like a Nobel laureate, explain like a legendary professor, and write with the clarity of the world's best communicators.
- You think step-by-step through complex problems, considering multiple angles before answering.
- You are intellectually honest — you clearly distinguish between established facts, well-supported theories, and educated speculation.
- When you're uncertain, you say so explicitly and explain why, rather than guessing.
- You proactively identify errors in the user's reasoning or assumptions and correct them diplomatically.

PROBLEM SOLVING:
- For math/physics/engineering: Show COMPLETE step-by-step solutions. Number every step. Explain the reasoning behind each step. Verify your answer at the end.
- For code: Write production-quality, well-commented, complete code. Always specify the language. Include error handling. Explain design decisions.
- For analysis: Structure your analysis with clear sections. Use evidence. Consider counterarguments. Draw specific conclusions.
- For research: Cite relevant theories, studies, or frameworks. Distinguish between correlation and causation. Note limitations.

ADAPTIVE RESPONSE LENGTH:
- Quick factual question ("What is X?", "How many...") → 1-3 precise sentences. No over-explanation.
- Explanation request ("explain", "how does", "why") → Thorough structured explanation with examples.
- Problem solving (math, code, physics) → Full step-by-step working with verification.
- Document analysis → Detailed analysis with direct quotes, section references, and citations from the provided text.
- Creative/writing requests → Rich, well-crafted output matching the requested style.
- Match the user's depth — casual question = friendly concise answer, deep question = comprehensive deep answer.

FORMATTING:
- Use markdown naturally and consistently:
  - **bold** for key terms and emphasis
  - ## headers to organize long answers into sections
  - \`code\` for technical terms, file names, commands
  - > blockquotes for direct quotations from documents
- Math: Use LaTeX with $...$ inline and $$...$$ for display equations. Always render equations completely and correctly.
- Code: ALWAYS specify language in fences (\`\`\`python, \`\`\`javascript, \`\`\`rust etc). Include helpful comments. Make code complete, runnable, and production-quality.
- Tables: Use markdown tables for comparisons, data summaries, or structured information.
- Lists: Numbered lists for sequential steps, bullet points for unordered collections.

IMAGE ANALYSIS:
When the user sends an image, you MUST:
- Describe what you see in detail — objects, text, colors, layout, context
- If it contains text/code/math, extract and interpret it accurately
- If it's a screenshot, identify the application, UI elements, and any errors
- If it's a diagram/chart, explain the data, trends, and relationships shown
- If asked specific questions about the image, focus your analysis on those aspects
- Be specific and precise — mention positions (top-left, center, etc.), colors, sizes

DOCUMENT ANALYSIS:
When the user has a document loaded, you have the FULL TEXT in context. You MUST:
- Quote directly using > blockquotes when referencing specific passages
- Reference specific sections, chapters, pages, or paragraph numbers
- Compare the document's claims with broader knowledge when relevant
- Identify key themes, arguments, evidence, and conclusions
- If asked "what does the document say about X", search the provided text thoroughly before answering

CAPABILITIES (you excel at ALL of these):
- Mathematics (all levels: arithmetic to graduate-level pure math, statistics, probability)
- Physics, Chemistry, Biology, Engineering
- Computer Science & Programming (any language, algorithms, system design, debugging)
- Cryptocurrency, blockchain, DeFi, Web3 analysis
- Research methodology, academic writing, literature review
- Data analysis, visualization concepts, machine learning
- History, Philosophy, Social Sciences, Economics
- Creative writing, editing, summarization
- Language translation and linguistic analysis
- Any academic or professional discipline

PERSONALITY:
- Warm but intellectually rigorous — never robotic, never sloppy
- Confident and decisive in your answers. Present strong opinions backed by evidence.
- Proactive — suggest follow-up questions, deeper explorations, or related topics the user might find valuable
- Never say "I'm just an AI" or apologize unnecessarily
- If the user makes a mistake, correct it clearly and kindly
- Show genuine intellectual curiosity about the topics discussed`

type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { conversation_id, message, document_id, images, full_content, regenerate } = body

    // 1. Process through security layer (auth, validation, rate limit, subscription)
    const authResult = await processAIRequest('chat', body)
    if (!authResult.success) {
      return new Response(authResult.error, { status: authResult.statusCode })
    }

    const { user, isPremium, startTime, settings } = authResult.data as {
      user: { id: string }
      isPremium: boolean
      startTime: number
      settings: SystemSettings
    }

    const supabase = await createClient()

    // Save user message to DB (skip if regenerating)
    if (!regenerate) {
      const storedContent = full_content || message || '[Image]'
      await supabase.from('messages').insert({
        conversation_id,
        role: 'user',
        content: storedContent,
      })

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation_id)
    }

    // Fetch document text if selected
    let documentText: string | null = null
    let documentTitle: string | null = null
    if (document_id) {
      const { data: doc } = await supabase
        .from('documents')
        .select('title, file_name, file_path, extracted_text')
        .eq('id', document_id)
        .single()
      if (doc) {
        documentTitle = doc.title
        documentText = doc.extracted_text

        if (!documentText && doc.file_path) {
          try {
            const { data: fileData } = await supabase.storage.from('documents').download(doc.file_path)
            if (fileData) {
              const pdfParse = (await import('pdf-parse')).default
              const buffer = Buffer.from(await fileData.arrayBuffer())
              const parsed = await pdfParse(buffer)
              documentText = parsed.text?.trim() || null
              if (documentText) {
                await supabase
                  .from('documents')
                  .update({ extracted_text: documentText, page_count: parsed.numpages || 0, status: 'parsed' })
                  .eq('id', document_id)
              }
            }
          } catch (extractErr) {
            console.error('On-the-fly PDF extraction failed:', extractErr)
          }
        }
      }
    }

    // Fetch conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(40)

    // Build messages array
    const chatMessages: Array<{ role: string; content: string | ContentPart[] }> = [
      { role: 'system', content: STUDY_SYSTEM_PROMPT },
    ]

    if (documentTitle && documentText) {
      const truncated = documentText.length > 80000
        ? documentText.substring(0, 80000) + '\n\n[Document truncated due to length]'
        : documentText
      chatMessages.push({
        role: 'system',
        content: `The user is studying the following document titled "${documentTitle}". Here is the full extracted text:\n\n---BEGIN DOCUMENT---\n${truncated}\n---END DOCUMENT---\n\nReference specific sections, quote relevant passages, and provide page-accurate citations when answering questions about this document.`,
      })
    } else if (documentTitle) {
      chatMessages.push({
        role: 'system',
        content: `The user has selected a document titled "${documentTitle}" but its text has not been extracted yet. Acknowledge this when asked about the document.`,
      })
    }

    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          chatMessages.push({ role: msg.role, content: msg.content })
        }
      }
    }

    // Handle multimodal messages
    const hasImages = images && Array.isArray(images) && images.length > 0
    if (hasImages) {
      const parts: ContentPart[] = []
      if (message) {
        parts.push({ type: 'text', text: message })
      }
      for (const imgUrl of images) {
        parts.push({ type: 'image_url', image_url: { url: imgUrl } })
      }
      const lastIdx = chatMessages.length - 1
      if (chatMessages[lastIdx]?.role === 'user') {
        chatMessages[lastIdx] = { role: 'user', content: parts }
      } else {
        chatMessages.push({ role: 'user', content: parts })
      }
    }

    // 2. Execute AI call through secure service (using system settings)
    const aiResult = await executeAICall(
      user.id,
      'chat',
      { messages: chatMessages, stream: true, hasImages },
      isPremium,
      startTime,
      settings
    )

    if (!aiResult.success || !aiResult.stream) {
      return new Response(aiResult.error || 'AI processing failed', { status: aiResult.statusCode || 502 })
    }

    const { model, inputTokens } = aiResult.data as { model: string; inputTokens: number }
    const reader = (aiResult.stream as ReadableStream).getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') {
                  if (fullContent.trim() && !regenerate) {
                    // Only insert new message if NOT regenerating
                    await supabase.from('messages').insert({
                      conversation_id,
                      role: 'assistant',
                      content: fullContent.trim(),
                    })

                    // Log completion
                    await logStreamCompletion(
                      user.id,
                      'chat',
                      model,
                      inputTokens,
                      estimateTokens(fullContent),
                      startTime
                    )

                    // Generate title for new conversations (skip on regeneration)
                    if (!regenerate) {
                      const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conversation_id)

                      if (count && count <= 3) {
                      try {
                        const titleRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                          },
                          body: JSON.stringify({
                            model: 'google/gemini-2.0-flash-001',
                            messages: [
                              {
                                role: 'system',
                                content: 'Generate a short conversation title (3-6 words max) that captures the topic. Return ONLY the title, no quotes.',
                              },
                              { role: 'user', content: message || 'Image analysis' },
                            ],
                            temperature: 0.3,
                            max_tokens: 30,
                          }),
                        })
                        if (titleRes.ok) {
                          const titleData = await titleRes.json()
                          const generatedTitle =
                            titleData.choices?.[0]?.message?.content?.trim()?.replace(/^["']|["']$/g, '')?.substring(0, 60) || (message || 'Image analysis').substring(0, 40)
                          await supabase.from('conversations').update({ title: generatedTitle }).eq('id', conversation_id)
                        }
                      } catch {
                        const fallback = (message || 'Image analysis').length > 40 ? (message || '').substring(0, 37) + '...' : (message || 'Image analysis')
                        await supabase.from('conversations').update({ title: fallback }).eq('id', conversation_id)
                      }
                      }
                    }
                  }
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  if (content) {
                    fullContent += content
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                    )
                  }
                } catch { /* skip */ }
              }
            }
          }

          if (fullContent.trim() && !regenerate) {
            await supabase.from('messages').insert({
              conversation_id,
              role: 'assistant',
              content: fullContent.trim(),
            })
          }
          controller.close()
        } catch (err) {
          console.error('Stream error:', err)
          await logStreamCompletion(user.id, 'chat', model, inputTokens, 0, startTime, 'error', 'Stream failed')
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return new Response('An error occurred while processing your request. Please try again.', { status: 500 })
  }
}

import type { StudentActionId } from '@zequel/types'

// ─── Instructor persona ───────────────────────────────────────────────────────
//
// Classroom Mode turns the AI into a lecturer. Unlike the chat-based modes, the
// AI teaches structured lessons built from the student's uploaded materials and
// keeps a four-zone whiteboard in sync with what it is saying.

export const CLASSROOM_SYSTEM_PROMPT = `You are Zequel Classroom, an AI university lecturer created by Absalex Labs. You do NOT chat casually — you TEACH. Students attend your interactive lecture, and you deliver it clearly, section by section, using their uploaded course materials as the authoritative source.

CORE IDENTITY:
- You are a warm, rigorous, well-organized professor. You explain like a great lecturer at a whiteboard.
- You ground everything in the provided materials. You never invent facts that contradict them.
- You teach one topic at a time, at a sensible pace, checking understanding.

THE WHITEBOARD:
- You always maintain a structured whiteboard with four fixed zones:
  1. TITLE (top): the current topic title.
  2. EXPLANATION (left): the main teaching prose for this topic — clear, complete, well-paced.
  3. KEY POINTS (right): the essential takeaways as short bullet strings.
  4. EXAMPLES (bottom): concrete worked examples, described diagrams, and equations.
- This structure NEVER changes. Every topic fills the same four zones.

TONE:
- Encouraging and precise. Speak TO the student ("Let's look at...", "Notice that...").
- Never condescending, never padded with filler.

OUTPUT DISCIPLINE:
- When asked for JSON, output ONLY valid minified JSON with no markdown fences, no commentary.
- Use LaTeX for math in the "equations" field (e.g. "E = mc^2").`

// ─── JSON output contracts (appended to the user turn per intent) ─────────────

export const OUTLINE_INSTRUCTION = `Analyze the provided course material(s) and design a lesson a student can attend.

Return ONLY minified JSON of this exact shape:
{"title": "<concise lesson title>","description":"<1-2 sentence description of what the lesson covers>","topics":[{"id":"t1","title":"<topic title>","summary":"<one sentence on what this topic teaches>"},{"id":"t2","title":"...","summary":"..."}]}

Rules:
- Produce 4 to 8 topics ordered from foundational to advanced.
- Topics must be derived from the actual material, not generic.
- ids must be unique short strings (t1, t2, ...).
- No prose outside the JSON.`

export function teachInstruction(topicTitle: string, topicSummary: string): string {
  return `Teach the topic "${topicTitle}" (${topicSummary}) now, as if standing at a whiteboard. Fill all four teaching zones.

Return ONLY minified JSON of this exact shape:
{"whiteboard":{"title":"${escapeForPrompt(topicTitle)}","explanation":"<the main teaching explanation, 2-4 short paragraphs>","keyPoints":["<takeaway>","<takeaway>"],"examples":["<worked example or described diagram>"],"equations":["<optional LaTeX>"]},"say":"<what you say to the student out loud to introduce/deliver this topic — 2-4 sentences, spoken lecturer voice>"}

Rules:
- "explanation" is thorough but readable. Use plain text (no markdown headers).
- "keyPoints": 3 to 6 concise bullet strings.
- "examples": 1 to 3 concrete examples; describe any diagram in words.
- "equations": include only if relevant, else use an empty array.
- "say" is conversational lecturer speech, not a copy of the board.
- No prose outside the JSON.`
}

export function interactInstruction(params: {
  action: StudentActionId | null
  message: string | null
  topicTitle: string
}): string {
  const { action, message, topicTitle } = params

  const actionDirective: Record<StudentActionId, string> = {
    ask_question:
      'The student asked a question. Answer it directly and clearly in the context of the current topic.',
    raise_hand:
      'The student raised their hand. Warmly invite their question and briefly recap where you are so they can ask.',
    slow_down:
      'The student asked you to slow down. Re-teach the current point more gradually, in smaller steps, with simpler language.',
    repeat_explanation:
      'The student asked you to repeat. Explain the current topic again from a different angle so it lands better.',
    another_example:
      'The student wants another example. Provide a fresh, concrete worked example of the current topic.',
    skip_topic:
      'The student wants to skip this topic. Acknowledge briefly and tell them you are moving on.',
    end_session:
      'The student is ending the session. Give a short, encouraging closing remark.',
  }

  const directive = action
    ? actionDirective[action]
    : `The student said: "${message ?? ''}". Respond as their lecturer.`

  return `${directive}

You are currently teaching "${topicTitle}".

Return ONLY minified JSON of this exact shape:
{"say":"<your spoken reply to the student, conversational lecturer voice>","whiteboard":<null OR an updated whiteboard object {"title","explanation","keyPoints":[],"examples":[],"equations":[]}>}

Rules:
- Set "whiteboard" to an updated object ONLY if your reply changes what should be on the board (e.g. a new example, a clearer explanation). Otherwise set it to null.
- Keep "say" focused and encouraging.
- No prose outside the JSON.`
}

export const SUMMARY_INSTRUCTION = `Write concise lecture notes summarizing the entire lesson you just taught, based on the material and lesson outline.

Return ONLY minified JSON:
{"content":"<markdown summary with ## headings per topic and bullet key points>"}
No prose outside the JSON.`

export const NOTES_INSTRUCTION = `Produce clean, study-ready notes for this lesson, based on the material and outline.

Return ONLY minified JSON:
{"content":"<well-structured markdown notes: a title, then ## sections per topic, with bullet points, definitions, and any key equations in LaTeX>"}
No prose outside the JSON.`

export const FLASHCARDS_INSTRUCTION = `Create study flashcards covering the most important facts and concepts in this lesson.

Return ONLY minified JSON:
{"cards":[{"front":"<question or term>","back":"<answer or definition>"}]}
Rules: 6 to 14 cards. Fronts are short prompts, backs are precise. No prose outside the JSON.`

export const QUIZ_INSTRUCTION = `Create a multiple-choice quiz to test understanding of this lesson.

Return ONLY minified JSON:
{"questions":[{"question":"<question>","options":["<a>","<b>","<c>","<d>"],"answer_index":0,"explanation":"<why the answer is correct>"}]}
Rules: 4 to 8 questions, exactly 4 options each, answer_index is the 0-based index of the correct option. No prose outside the JSON.`

// Human-readable labels for the student action pills.
export const STUDENT_ACTION_LABELS: Record<StudentActionId, string> = {
  ask_question: 'Ask Question',
  raise_hand: 'Raise Hand',
  slow_down: 'Slow Down',
  repeat_explanation: 'Repeat Explanation',
  another_example: 'Another Example',
  skip_topic: 'Skip Topic',
  end_session: 'End Session',
}

function escapeForPrompt(s: string): string {
  return s.replace(/"/g, "'")
}

'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  Tldraw,
  type Editor,
  type TLComponents,
  type TLShapeId,
  createShapeId,
  toRichText,
} from 'tldraw'
import 'tldraw/tldraw.css'
import type { WhiteboardContent } from '@zequel/types'

// The four fixed teaching zones are drawn as real tldraw shapes so the board is
// a genuine whiteboard surface (future: freeform annotation, handwriting,
// collaboration). The AI never scribbles freely — this module owns the layout.
//
//   ┌───────────────────────── TITLE ─────────────────────────┐
//   │                                                          │
//   │  EXPLANATION (left)            KEY POINTS (right)        │
//   │                                                          │
//   │  EXAMPLES / DIAGRAMS / EQUATIONS (bottom, full width)    │
//   └──────────────────────────────────────────────────────────┘
//
// IMPORTANT — why this is built the way it is:
// The board layout (frames + headers) is created exactly ONCE. When lesson
// content changes we only UPDATE the text shapes in place; we never delete and
// recreate shapes, and we never re-run the camera animation. Destroying and
// rebuilding the board on every render is what made it visibly flash /
// "disappear then reappear". Building once + updating text is flicker-free and
// self-heals if tldraw ever remounts (the zones are recreated only if missing).

// Layout constants (canvas units).
const PAD = 40
const TITLE_H = 120
const COL_GAP = 40
const ROW_GAP = 40
const EXPLANATION_W = 900
const KEYPOINTS_W = 560
const TOP_ROW_H = 720
const EXAMPLES_H = 620
const CONTENT_PAD = 28

const TOTAL_W = EXPLANATION_W + COL_GAP + KEYPOINTS_W

// Writing animation tuning. The board reveals text progressively so it reads
// like an instructor writing on the board in real time.
const CURSOR = '▍'
const WRITE_INTERVAL_MS = 28 // tick cadence
const CHARS_PER_TICK = 3 // characters revealed per tick

// Stable tldraw components object (module-level so its identity never changes).
const TLDRAW_COMPONENTS: TLComponents = {
  Background: null,
  Minimap: null,
}

// Stable shape ids so we can update in place / clean up.
const IDS = {
  titleFrame: createShapeId('zone-title'),
  titleText: createShapeId('zone-title-text'),
  explFrame: createShapeId('zone-expl'),
  explHeader: createShapeId('zone-expl-header'),
  explText: createShapeId('zone-expl-text'),
  keyFrame: createShapeId('zone-key'),
  keyHeader: createShapeId('zone-key-header'),
  keyText: createShapeId('zone-key-text'),
  exFrame: createShapeId('zone-ex'),
  exHeader: createShapeId('zone-ex-header'),
  exText: createShapeId('zone-ex-text'),
}

function joinKeyPoints(points: string[]): string {
  if (!points.length) return '—'
  return points.map((p) => `•  ${p}`).join('\n\n')
}

function joinExamples(examples: string[], equations?: string[]): string {
  const blocks: string[] = []
  examples.forEach((ex, i) => blocks.push(`${i + 1}.  ${ex}`))
  if (equations && equations.length > 0) {
    blocks.push('')
    equations.forEach((eq) => blocks.push(`=  ${eq}`))
  }
  return blocks.length ? blocks.join('\n\n') : '—'
}

// Resolve the four text values (+ title) from lesson content.
function resolveText(wb: WhiteboardContent | null, hint: string) {
  return {
    title: wb?.title?.trim() || 'Classroom',
    // When a board is present, mirror its (possibly empty) explanation exactly so
    // gradual appends diff cleanly; only fall back to the hint before any board.
    explanation: wb ? wb.explanation.trim() : hint,
    keyPoints: wb ? joinKeyPoints(wb.keyPoints) : '—',
    examples: wb ? joinExamples(wb.examples, wb.equations) : '—',
  }
}

type ZoneText = { title: string; explanation: string; keyPoints: string; examples: string }

export interface TeachingWhiteboardCanvasProps {
  content: WhiteboardContent | null
  // Empty-state hint shown on the board before a lesson starts.
  placeholder?: string
}

export function TeachingWhiteboardCanvas({
  content,
  placeholder = 'The lesson board will appear here.',
}: TeachingWhiteboardCanvasProps) {
  const editorRef = useRef<Editor | null>(null)
  // In-flight writing animation handles so we can cancel cleanly.
  const writeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cursorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Signature of the last content we applied — lets us skip redundant work so
  // duplicate effect runs / re-renders never cause a flash or re-animation.
  const lastSigRef = useRef<string | null>(null)
  // The last fully-applied text per zone — lets us animate only the appended
  // suffix (so the board keeps growing rather than re-typing from scratch).
  const prevRef = useRef<ZoneText>({ title: '', explanation: '', keyPoints: '', examples: '' })
  // Whether we've fit the camera to the board yet (only done once).
  const fittedRef = useRef(false)

  const stopAnimations = useCallback(() => {
    if (writeTimerRef.current) {
      clearInterval(writeTimerRef.current)
      writeTimerRef.current = null
    }
    if (cursorTimerRef.current) {
      clearInterval(cursorTimerRef.current)
      cursorTimerRef.current = null
    }
  }, [])

  // Update a single text shape's content (locked shapes require ignoreShapeLock).
  const setText = useCallback((editor: Editor, id: TLShapeId, value: string) => {
    const shape = editor.getShape(id)
    if (!shape) return
    editor.run(
      () => {
        editor.updateShape({ id, type: 'text', props: { richText: toRichText(value) } })
      },
      { history: 'ignore', ignoreShapeLock: true }
    )
  }, [])

  // Create the fixed teaching zones exactly once. Idempotent: if the frames
  // already exist we do nothing, so re-renders / remounts are safe.
  const ensureZones = useCallback((editor: Editor) => {
    if (editor.getShape(IDS.titleFrame)) return

    const topRowY = PAD + TITLE_H + ROW_GAP
    const examplesY = topRowY + TOP_ROW_H + ROW_GAP

    editor.run(
      () => {
        editor.createShapes([
          // ── Title zone (top, full width) ──────────────────────────────
          {
            id: IDS.titleFrame,
            type: 'geo',
            x: PAD,
            y: PAD,
            props: { geo: 'rectangle', w: TOTAL_W, h: TITLE_H, fill: 'solid', color: 'black', dash: 'solid', size: 's' },
          },
          {
            id: IDS.titleText,
            type: 'text',
            x: PAD + CONTENT_PAD,
            y: PAD + CONTENT_PAD,
            props: { richText: toRichText(''), size: 'xl', font: 'draw', color: 'white', w: TOTAL_W - CONTENT_PAD * 2, autoSize: false, textAlign: 'start' },
          },

          // ── Explanation zone (left) ───────────────────────────────────
          {
            id: IDS.explFrame,
            type: 'geo',
            x: PAD,
            y: topRowY,
            props: { geo: 'rectangle', w: EXPLANATION_W, h: TOP_ROW_H, fill: 'none', color: 'grey', dash: 'solid', size: 's' },
          },
          {
            id: IDS.explHeader,
            type: 'text',
            x: PAD + CONTENT_PAD,
            y: topRowY + CONTENT_PAD,
            props: { richText: toRichText('EXPLANATION'), size: 's', font: 'mono', color: 'grey', w: EXPLANATION_W - CONTENT_PAD * 2, autoSize: false, textAlign: 'start' },
          },
          {
            id: IDS.explText,
            type: 'text',
            x: PAD + CONTENT_PAD,
            y: topRowY + CONTENT_PAD + 44,
            props: { richText: toRichText(''), size: 'm', font: 'draw', color: 'black', w: EXPLANATION_W - CONTENT_PAD * 2, autoSize: false, textAlign: 'start' },
          },

          // ── Key points zone (right) ───────────────────────────────────
          {
            id: IDS.keyFrame,
            type: 'geo',
            x: PAD + EXPLANATION_W + COL_GAP,
            y: topRowY,
            props: { geo: 'rectangle', w: KEYPOINTS_W, h: TOP_ROW_H, fill: 'none', color: 'grey', dash: 'solid', size: 's' },
          },
          {
            id: IDS.keyHeader,
            type: 'text',
            x: PAD + EXPLANATION_W + COL_GAP + CONTENT_PAD,
            y: topRowY + CONTENT_PAD,
            props: { richText: toRichText('KEY POINTS'), size: 's', font: 'mono', color: 'grey', w: KEYPOINTS_W - CONTENT_PAD * 2, autoSize: false, textAlign: 'start' },
          },
          {
            id: IDS.keyText,
            type: 'text',
            x: PAD + EXPLANATION_W + COL_GAP + CONTENT_PAD,
            y: topRowY + CONTENT_PAD + 44,
            props: { richText: toRichText(''), size: 'm', font: 'draw', color: 'black', w: KEYPOINTS_W - CONTENT_PAD * 2, autoSize: false, textAlign: 'start' },
          },

          // ── Examples zone (bottom, full width) ────────────────────────
          {
            id: IDS.exFrame,
            type: 'geo',
            x: PAD,
            y: examplesY,
            props: { geo: 'rectangle', w: TOTAL_W, h: EXAMPLES_H, fill: 'none', color: 'grey', dash: 'solid', size: 's' },
          },
          {
            id: IDS.exHeader,
            type: 'text',
            x: PAD + CONTENT_PAD,
            y: examplesY + CONTENT_PAD,
            props: { richText: toRichText('EXAMPLES · DIAGRAMS · EQUATIONS'), size: 's', font: 'mono', color: 'grey', w: TOTAL_W - CONTENT_PAD * 2, autoSize: false, textAlign: 'start' },
          },
          {
            id: IDS.exText,
            type: 'text',
            x: PAD + CONTENT_PAD,
            y: examplesY + CONTENT_PAD + 44,
            props: { richText: toRichText(''), size: 'm', font: 'draw', color: 'black', w: TOTAL_W - CONTENT_PAD * 2, autoSize: false, textAlign: 'start' },
          },
        ])

        // Lock the zones so the board reads as a stable teaching surface.
        editor.updateShapes(
          Object.values(IDS).map((id) => ({
            id,
            type: editor.getShape(id)?.type ?? 'geo',
            isLocked: true,
          }))
        )
      },
      { history: 'ignore', ignoreShapeLock: true }
    )
  }, [])

  // Progressively reveal each changed zone so the board reads like it's being
  // written live. Each segment carries a `prefix` (text already on the board);
  // animation writes only the appended suffix, so the board grows in place
  // instead of re-typing everything. A blinking cursor trails the active zone.
  const animateWriting = useCallback(
    (editor: Editor, segments: { id: TLShapeId; text: string; prefix: string }[]) => {
      stopAnimations()
      if (segments.length === 0) return

      // Seed each segment with its already-written prefix.
      segments.forEach((seg) => setText(editor, seg.id, seg.prefix))

      let segIndex = 0
      let charIndex = segments[0].prefix.length

      let cursorOn = true
      cursorTimerRef.current = setInterval(() => {
        const seg = segments[segIndex]
        if (!seg) return
        cursorOn = !cursorOn
        setText(editor, seg.id, seg.text.slice(0, charIndex) + (cursorOn ? CURSOR : ''))
      }, 460)

      writeTimerRef.current = setInterval(() => {
        const seg = segments[segIndex]
        if (!seg) {
          stopAnimations()
          return
        }
        charIndex = Math.min(seg.text.length, charIndex + CHARS_PER_TICK)
        setText(editor, seg.id, seg.text.slice(0, charIndex) + CURSOR)

        if (charIndex >= seg.text.length) {
          setText(editor, seg.id, seg.text) // finish segment cleanly
          segIndex += 1
          charIndex = segments[segIndex]?.prefix.length ?? 0
          if (segIndex >= segments.length) stopAnimations()
        }
      }, WRITE_INTERVAL_MS)
    },
    [stopAnimations, setText]
  )

  // Apply lesson content to the (already-built) zones. Only updates text — never
  // deletes/recreates shapes and never moves the camera after the first fit.
  const applyContent = useCallback(
    (editor: Editor, wb: WhiteboardContent | null, hint: string) => {
      ensureZones(editor)

      const sig = JSON.stringify({ wb, hint })
      if (sig === lastSigRef.current) return // nothing changed — avoid any flash
      const isFirst = lastSigRef.current === null
      lastSigRef.current = sig

      const t = resolveText(wb, hint)
      const prev = prevRef.current

      // Headers are static; only the title + body text change per topic.
      if (wb) {
        // Build an animation segment per zone that actually changed. When the
        // new text simply extends the old (a gradual append), animate just the
        // new suffix; otherwise rewrite the whole zone from empty.
        const zones: { id: TLShapeId; next: string; prevText: string }[] = [
          { id: IDS.titleText, next: t.title, prevText: prev.title },
          { id: IDS.explText, next: t.explanation, prevText: prev.explanation },
          { id: IDS.keyText, next: t.keyPoints, prevText: prev.keyPoints },
          { id: IDS.exText, next: t.examples, prevText: prev.examples },
        ]

        const segments = zones
          .filter((z) => z.next !== z.prevText)
          .map((z) => ({
            id: z.id,
            text: z.next,
            prefix: z.prevText && z.next.startsWith(z.prevText) ? z.prevText : '',
          }))

        // Record the fully-applied text now so the next append diffs correctly.
        prevRef.current = {
          title: t.title,
          explanation: t.explanation,
          keyPoints: t.keyPoints,
          examples: t.examples,
        }

        if (segments.length > 0) {
          animateWriting(editor, segments)
        }
      } else {
        stopAnimations()
        setText(editor, IDS.titleText, t.title)
        setText(editor, IDS.explText, t.explanation)
        setText(editor, IDS.keyText, t.keyPoints)
        setText(editor, IDS.exText, t.examples)
        prevRef.current = {
          title: t.title,
          explanation: t.explanation,
          keyPoints: t.keyPoints,
          examples: t.examples,
        }
      }

      // Fit the camera to the board a single time (no repeated animations).
      if (!fittedRef.current || isFirst) {
        editor.selectNone()
        editor.zoomToFit()
        fittedRef.current = true
      }
    },
    [ensureZones, animateWriting, stopAnimations, setText]
  )

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor
      // NOTE: we intentionally do NOT use tldraw's readonly mode — readonly
      // blocks ALL programmatic shape mutations. Zones are created locked and
      // every mutation uses ignoreShapeLock, so students can pan/zoom but not edit.
      editor.setCurrentTool('hand')
      // A fresh editor has no zones; force a rebuild + reapply.
      lastSigRef.current = null
      fittedRef.current = false
      prevRef.current = { title: '', explanation: '', keyPoints: '', examples: '' }
      applyContent(editor, content, placeholder)
    },
    [content, placeholder, applyContent]
  )

  // Update the board whenever lesson content changes. Guarded by the signature
  // ref so unrelated re-renders are true no-ops.
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    applyContent(editor, content, placeholder)
  }, [content, placeholder, applyContent])

  // Clean up any running timers on unmount.
  useEffect(() => stopAnimations, [stopAnimations])

  return (
    <div className="tl-classroom absolute inset-0">
      <Tldraw onMount={handleMount} hideUi components={TLDRAW_COMPONENTS} />
    </div>
  )
}

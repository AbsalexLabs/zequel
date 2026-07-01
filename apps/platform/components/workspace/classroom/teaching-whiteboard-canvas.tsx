'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  Tldraw,
  type Editor,
  type TLShapeId,
  createShapeId,
  toRichText,
} from 'tldraw'
import 'tldraw/tldraw.css'
import type { WhiteboardContent } from '@zequel/types'

// The four fixed teaching zones are drawn as real tldraw shapes so the board is
// a genuine whiteboard surface (future: freeform annotation, handwriting,
// collaboration). The AI never scribbles freely — this module owns the layout
// and rebuilds the zones whenever the lesson content changes.
//
//   ┌───────────────────────── TITLE ─────────────────────────┐
//   │                                                          │
//   │  EXPLANATION (left)            KEY POINTS (right)        │
//   │                                                          │
//   │  EXAMPLES / DIAGRAMS / EQUATIONS (bottom, full width)    │
//   └──────────────────────────────────────────────────────────┘

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
  // Handle for the in-flight writing animation so we can cancel it cleanly.
  const writeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cursorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Progressively reveal a queue of text zones, one after another, so the board
  // reads like it is being written live. A blinking cursor trails the writing.
  const animateWriting = useCallback(
    (editor: Editor, segments: { id: TLShapeId; text: string }[]) => {
      stopAnimations()

      let segIndex = 0
      let charIndex = 0

      const setText = (id: TLShapeId, value: string) => {
        const shape = editor.getShape(id)
        if (!shape) return
        editor.run(
          () => {
            editor.updateShape({ id, type: 'text', props: { richText: toRichText(value) } })
          },
          // history: ignore keeps writes out of undo; ignoreShapeLock lets us
          // mutate the locked teaching zones programmatically.
          { history: 'ignore', ignoreShapeLock: true }
        )
      }

      // Blinking cursor on the segment currently being written.
      let cursorOn = true
      cursorTimerRef.current = setInterval(() => {
        const seg = segments[segIndex]
        if (!seg) return
        cursorOn = !cursorOn
        const revealed = seg.text.slice(0, charIndex)
        setText(seg.id, revealed + (cursorOn ? CURSOR : ''))
      }, 460)

      writeTimerRef.current = setInterval(() => {
        const seg = segments[segIndex]
        if (!seg) {
          stopAnimations()
          return
        }

        charIndex = Math.min(seg.text.length, charIndex + CHARS_PER_TICK)
        setText(seg.id, seg.text.slice(0, charIndex) + CURSOR)

        if (charIndex >= seg.text.length) {
          // Finish this segment cleanly (no cursor) and advance to the next.
          setText(seg.id, seg.text)
          segIndex += 1
          charIndex = 0
          if (segIndex >= segments.length) {
            stopAnimations()
          }
        }
      }, WRITE_INTERVAL_MS)
    },
    [stopAnimations]
  )

  const render = useCallback(
    (editor: Editor, wb: WhiteboardContent | null, hint: string, animate: boolean) => {
      stopAnimations()

      editor.run(
        () => {
          // Remove any existing zone shapes (and stray user shapes) for a clean,
          // consistent board on every render.
          const existing = Array.from(editor.getCurrentPageShapeIds())
          if (existing.length > 0) editor.deleteShapes(existing as TLShapeId[])

          const title = wb?.title?.trim() || 'Classroom'
          const explanation = wb?.explanation?.trim() || hint
          const keyPoints = wb ? joinKeyPoints(wb.keyPoints) : '—'
          const examples = wb ? joinExamples(wb.examples, wb.equations) : '—'

          const topRowY = PAD + TITLE_H + ROW_GAP
          const examplesY = topRowY + TOP_ROW_H + ROW_GAP

          // When animating, body text starts empty and is written in over time.
          const initialExpl = animate ? '' : explanation
          const initialKey = animate ? '' : keyPoints
          const initialEx = animate ? '' : examples

          editor.createShapes([
            // ── Title zone (top, full width) ──────────────────────────────
            {
              id: IDS.titleFrame,
              type: 'geo',
              x: PAD,
              y: PAD,
              props: {
                geo: 'rectangle',
                w: TOTAL_W,
                h: TITLE_H,
                fill: 'solid',
                color: 'black',
                dash: 'solid',
                size: 's',
              },
            },
            {
              id: IDS.titleText,
              type: 'text',
              x: PAD + CONTENT_PAD,
              y: PAD + CONTENT_PAD,
              props: {
                richText: toRichText(animate ? '' : title),
                size: 'xl',
                font: 'draw',
                color: 'white',
                w: TOTAL_W - CONTENT_PAD * 2,
                autoSize: false,
                textAlign: 'start',
              },
            },

            // ── Explanation zone (left) ───────────────────────────────────
            {
              id: IDS.explFrame,
              type: 'geo',
              x: PAD,
              y: topRowY,
              props: {
                geo: 'rectangle',
                w: EXPLANATION_W,
                h: TOP_ROW_H,
                fill: 'none',
                color: 'grey',
                dash: 'solid',
                size: 's',
              },
            },
            {
              id: IDS.explHeader,
              type: 'text',
              x: PAD + CONTENT_PAD,
              y: topRowY + CONTENT_PAD,
              props: {
                richText: toRichText('EXPLANATION'),
                size: 's',
                font: 'mono',
                color: 'grey',
                w: EXPLANATION_W - CONTENT_PAD * 2,
                autoSize: false,
                textAlign: 'start',
              },
            },
            {
              id: IDS.explText,
              type: 'text',
              x: PAD + CONTENT_PAD,
              y: topRowY + CONTENT_PAD + 44,
              props: {
                richText: toRichText(initialExpl),
                size: 'm',
                font: 'draw',
                color: 'black',
                w: EXPLANATION_W - CONTENT_PAD * 2,
                autoSize: false,
                textAlign: 'start',
              },
            },

            // ── Key points zone (right) ───────────────────────────────────
            {
              id: IDS.keyFrame,
              type: 'geo',
              x: PAD + EXPLANATION_W + COL_GAP,
              y: topRowY,
              props: {
                geo: 'rectangle',
                w: KEYPOINTS_W,
                h: TOP_ROW_H,
                fill: 'none',
                color: 'grey',
                dash: 'solid',
                size: 's',
              },
            },
            {
              id: IDS.keyHeader,
              type: 'text',
              x: PAD + EXPLANATION_W + COL_GAP + CONTENT_PAD,
              y: topRowY + CONTENT_PAD,
              props: {
                richText: toRichText('KEY POINTS'),
                size: 's',
                font: 'mono',
                color: 'grey',
                w: KEYPOINTS_W - CONTENT_PAD * 2,
                autoSize: false,
                textAlign: 'start',
              },
            },
            {
              id: IDS.keyText,
              type: 'text',
              x: PAD + EXPLANATION_W + COL_GAP + CONTENT_PAD,
              y: topRowY + CONTENT_PAD + 44,
              props: {
                richText: toRichText(initialKey),
                size: 'm',
                font: 'draw',
                color: 'black',
                w: KEYPOINTS_W - CONTENT_PAD * 2,
                autoSize: false,
                textAlign: 'start',
              },
            },

            // ── Examples zone (bottom, full width) ────────────────────────
            {
              id: IDS.exFrame,
              type: 'geo',
              x: PAD,
              y: examplesY,
              props: {
                geo: 'rectangle',
                w: TOTAL_W,
                h: EXAMPLES_H,
                fill: 'none',
                color: 'grey',
                dash: 'solid',
                size: 's',
              },
            },
            {
              id: IDS.exHeader,
              type: 'text',
              x: PAD + CONTENT_PAD,
              y: examplesY + CONTENT_PAD,
              props: {
                richText: toRichText('EXAMPLES · DIAGRAMS · EQUATIONS'),
                size: 's',
                font: 'mono',
                color: 'grey',
                w: TOTAL_W - CONTENT_PAD * 2,
                autoSize: false,
                textAlign: 'start',
              },
            },
            {
              id: IDS.exText,
              type: 'text',
              x: PAD + CONTENT_PAD,
              y: examplesY + CONTENT_PAD + 44,
              props: {
                richText: toRichText(initialEx),
                size: 'm',
                font: 'draw',
                color: 'black',
                w: TOTAL_W - CONTENT_PAD * 2,
                autoSize: false,
                textAlign: 'start',
              },
            },
          ])

          // Lock the zone shapes so they read as a stable teaching surface.
          editor.updateShapes(
            Object.values(IDS).map((id) => ({
              id,
              type: editor.getShape(id)?.type ?? 'geo',
              isLocked: true,
            }))
          )

          editor.selectNone()
          editor.zoomToFit({ animation: { duration: 200 } })
        },
        // ignoreShapeLock is required so we can delete/replace the locked zone
        // shapes on every re-render (topic change).
        { history: 'ignore', ignoreShapeLock: true }
      )

      // Kick off the live "writing" pass after the zones exist.
      if (animate) {
        animateWriting(editor, [
          { id: IDS.titleText, text: wb?.title?.trim() || 'Classroom' },
          { id: IDS.explText, text: wb?.explanation?.trim() || hint },
          { id: IDS.keyText, text: wb ? joinKeyPoints(wb.keyPoints) : '—' },
          { id: IDS.exText, text: wb ? joinExamples(wb.examples, wb.equations) : '—' },
        ])
      }
    },
    [animateWriting, stopAnimations]
  )

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor
      // NOTE: we intentionally do NOT use tldraw's readonly mode here — readonly
      // blocks ALL programmatic shape mutations (createShapes/updateShapes), which
      // would leave the board permanently blank. Instead the teaching zones are
      // created locked (isLocked) and every mutation runs with ignoreShapeLock,
      // so students can pan/zoom but cannot edit the board content.
      editor.setCurrentTool('hand')
      // Animate the first paint only when there is real lesson content.
      render(editor, content, placeholder, Boolean(content))
    },
    [content, placeholder, render]
  )

  // Re-render zones whenever the AI updates the whiteboard content, writing the
  // new material in live. The empty/placeholder state renders instantly.
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    render(editor, content, placeholder, Boolean(content))
  }, [content, placeholder, render])

  // Clean up any running timers on unmount.
  useEffect(() => stopAnimations, [stopAnimations])

  return (
    <div className="tl-classroom absolute inset-0">
      <Tldraw
        onMount={handleMount}
        hideUi
        components={{
          Background: null,
          Minimap: null,
        }}
      />
    </div>
  )
}

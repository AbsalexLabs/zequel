'use client'

import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { sql } from '@codemirror/lang-sql'
import type { Extension } from '@codemirror/state'
import type { CodingLanguage } from '@/lib/types'

function languageExtension(language: CodingLanguage): Extension[] {
  switch (language) {
    case 'javascript':
      return [javascript({ jsx: true })]
    case 'typescript':
      return [javascript({ jsx: true, typescript: true })]
    case 'python':
      return [python()]
    case 'html':
      return [html()]
    case 'css':
      return [css()]
    case 'java':
      return [java()]
    case 'cpp':
      return [cpp()]
    case 'sql':
      return [sql()]
    default:
      return [javascript()]
  }
}

// Monochrome dark theme tuned to match Zequel's #0d1117 code surface.
const zequelTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#0d1117',
      color: '#e6edf3',
      height: '100%',
      fontSize: '13px',
    },
    '.cm-content': {
      fontFamily:
        'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
      caretColor: '#e6edf3',
      padding: '12px 0',
    },
    '.cm-gutters': {
      backgroundColor: '#0d1117',
      color: '#484f58',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255,255,255,0.04)',
      color: '#8b949e',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(255,255,255,0.12) !important',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#e6edf3',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 12px 0 8px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-scroller': {
      fontFamily:
        'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
      lineHeight: '1.6',
    },
  },
  { dark: true }
)

interface CodeEditorProps {
  value: string
  language: CodingLanguage
  onChange: (value: string) => void
  readOnly?: boolean
}

export function CodeEditor({ value, language, onChange, readOnly }: CodeEditorProps) {
  const extensions = useMemo(
    () => [...languageExtension(language), zequelTheme, EditorView.lineWrapping],
    [language]
  )

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme="dark"
      extensions={extensions}
      onChange={onChange}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        foldGutter: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
        tabSize: 2,
      }}
      className="h-full text-[13px]"
    />
  )
}

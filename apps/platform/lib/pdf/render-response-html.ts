import 'server-only'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { PRINT_STYLES } from './print-styles'

export const KATEX_CSS_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
export const FONT_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Renders an AI response through the same MarkdownRenderer the chat uses, then
 * wraps it in a print document. react-markdown escapes raw HTML (no rehype-raw),
 * so model output cannot inject markup into the headless browser.
 */
export function renderResponseHtml({ markdown, title }: { markdown: string; title: string }): string {
  const body = renderToStaticMarkup(
    createElement(MarkdownRenderer, { content: markdown, className: 'doc-body' }),
  )
  const exportedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const safeTitle = escapeHtml(title)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<link rel="stylesheet" href="${FONT_CSS_URL}">
<link rel="stylesheet" href="${KATEX_CSS_URL}">
<style>${PRINT_STYLES}</style>
</head>
<body>
<header class="doc-header">
  <span class="doc-brand">Zequel</span>
  <span class="doc-meta">${safeTitle} &middot; ${escapeHtml(exportedAt)}</span>
</header>
${body}
</body>
</html>`
}

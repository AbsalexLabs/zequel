'use client'

import { cn } from '@/lib/utils'
import { getLanguageMeta } from '@/lib/coding/languages'
import { ImageIcon, FileText } from 'lucide-react'
import type { CodingFile } from '@/lib/types'

/**
 * Branded file icon: a rounded square in the file's language accent color with
 * the language's short tag (e.g. "TS", "PY"). Uploaded assets show a generic
 * image/file glyph instead. Kept on-brand: muted, squared, monospace tag.
 */
export function FileLanguageIcon({
  language,
  kind = 'text',
  mimeType,
  className,
  size = 18,
}: {
  language?: CodingFile['language']
  kind?: CodingFile['kind']
  mimeType?: string | null
  className?: string
  size?: number
}) {
  if (kind === 'upload') {
    const isImage = (mimeType ?? '').startsWith('image/')
    const Glyph = isImage ? ImageIcon : FileText
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-[4px] border border-border bg-secondary text-muted-foreground',
          className
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Glyph style={{ width: size * 0.6, height: size * 0.6 }} />
      </span>
    )
  }

  const meta = getLanguageMeta(language)
  // Scale font with the badge; clamp so long tags ("JSON") still fit.
  const fontSize = Math.max(6, Math.round(size * (meta.short.length > 2 ? 0.34 : 0.42)))

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[4px] font-mono font-semibold leading-none tracking-tight',
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize,
        // Subtle tinted badge: accent color at low opacity with a matching ring.
        backgroundColor: `${meta.color}1f`,
        color: meta.color,
        border: `1px solid ${meta.color}40`,
      }}
      aria-hidden
    >
      {meta.short}
    </span>
  )
}

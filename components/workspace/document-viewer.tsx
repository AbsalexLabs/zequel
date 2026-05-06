'use client'

import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, FileText, Copy, Check } from 'lucide-react'
import type { Document } from '@/lib/types'

interface DocumentViewerProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  extractedText: string | null
  isLoading?: boolean
}

export function DocumentViewer({ document, isOpen, onClose, extractedText, isLoading }: DocumentViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyText = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl border-border bg-background p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <h2 className="font-sans text-sm font-semibold text-foreground truncate">{document.title}</h2>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {document.page_count > 0 ? `${document.page_count} pages` : 'N/A'} • {document.file_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between gap-3">
          <div>
            <Badge 
              variant="outline" 
              className={`font-mono text-[10px] uppercase tracking-wider ${
                document.status === 'parsed' 
                  ? 'bg-green-500/10 text-green-700 border-green-200' 
                  : document.status === 'processing'
                  ? 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
                  : 'bg-red-500/10 text-red-700 border-red-200'
              }`}
            >
              {document.status === 'parsed' ? '✓ Parsed' : document.status === 'processing' ? '⏳ Processing' : '⚠ Error'}
            </Badge>
          </div>
          {extractedText && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-2 font-mono uppercase tracking-wider"
              onClick={handleCopyText}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Text
                </>
              )}
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="py-8 text-center">
                <p className="font-mono text-[11px] text-muted-foreground animate-pulse">Loading document content...</p>
              </div>
            ) : extractedText ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="font-sans text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                  {extractedText}
                </div>
              </div>
            ) : document.status === 'processing' ? (
              <div className="py-8 text-center">
                <p className="font-mono text-[11px] text-muted-foreground">Document is being processed...</p>
              </div>
            ) : document.status === 'parsed' ? (
              <div className="py-8 text-center">
                <p className="font-mono text-[11px] text-muted-foreground">No text content extracted</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="font-mono text-[11px] text-destructive">Failed to parse document</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

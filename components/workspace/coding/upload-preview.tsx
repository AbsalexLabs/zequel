'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Download, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CodingFile } from '@/lib/types'

const UPLOAD_BUCKET = 'coding-files'

/**
 * Read-only viewer for uploaded assets. Images render inline; everything else
 * gets a download link. URLs are short-lived signed links from the private
 * bucket, so each file generates its own.
 */
export function UploadPreview({ file }: { file: CodingFile }) {
  const [url, setUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setUrl(null)

    const run = async () => {
      if (!file.storage_path) {
        if (!cancelled) setStatus('error')
        return
      }
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .createSignedUrl(file.storage_path, 60 * 60)
      if (cancelled) return
      if (error || !data?.signedUrl) {
        setStatus('error')
        return
      }
      setUrl(data.signedUrl)
      setStatus('ready')
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [file.storage_path])

  const isImage = (file.mime_type ?? '').startsWith('image/')

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === 'error' || !url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
        <p className="font-sans text-sm text-muted-foreground">
          Could not load this file.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 overflow-auto p-6">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url || '/placeholder.svg'}
          alt={file.name}
          className="max-h-[70%] max-w-full rounded-md border border-border object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <FileText className="h-10 w-10" />
          <span className="font-mono text-xs">{file.mime_type || 'file'}</span>
        </div>
      )}
      <a href={url} download={file.name} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </a>
    </div>
  )
}

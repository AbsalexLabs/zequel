'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorkspaceStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { ZequelAvatar } from '@/components/zequel-icon'
import { cn } from '@/lib/utils'
import {
  Loader2,
  Send,
  Plus,
  FileText,
  Pencil,
  Check,
  X,
  RotateCcw,
  Copy,
  Share2,
  MoreHorizontal,
  GitBranch,
  Paperclip,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Conversation, Message } from '@/lib/types'

interface AttachedFile {
  file: File
  preview?: string // data URL for images
}

export function StudyPanel() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    addConversation,
    updateConversationTitle,
    messages,
    setMessages,
    addMessage,
    updateMessage,
    isStreaming,
    setIsStreaming,
    documents,
    selectedDocumentIds,
  } = useWorkspaceStore()

  const [input, setInput] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState('U')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [editingImages, setEditingImages] = useState<string[]>([]) // Store images when editing
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isFirstMessage = useRef(false)
  const shouldAutoScroll = useRef(true)

  // Throttled streaming buffer — accumulates text and renders at a smooth pace
  const streamBufferRef = useRef('')
  const displayedLengthRef = useRef(0)
  const renderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startStreamRenderer = useCallback(() => {
    displayedLengthRef.current = 0
    streamBufferRef.current = ''
    setStreamingContent('')

    if (renderTimerRef.current) clearInterval(renderTimerRef.current)

    renderTimerRef.current = setInterval(() => {
      const buffer = streamBufferRef.current
      const currentLen = displayedLengthRef.current

      if (currentLen >= buffer.length) return // nothing new to show

      // Reveal characters in batches — bigger batch = faster appearance
      // Adaptive: short responses show char-by-char, long ones batch more
      const remaining = buffer.length - currentLen
      const batchSize = remaining > 200 ? Math.min(remaining, 12) : remaining > 50 ? 6 : 3

      const nextLen = Math.min(currentLen + batchSize, buffer.length)
      displayedLengthRef.current = nextLen
      setStreamingContent(buffer.substring(0, nextLen))
    }, 20) // 50fps render rate — smooth but not overwhelming
  }, [])

  const stopStreamRenderer = useCallback(() => {
    if (renderTimerRef.current) {
      clearInterval(renderTimerRef.current)
      renderTimerRef.current = null
    }
    // Show any remaining buffered content immediately
    if (streamBufferRef.current) {
      setStreamingContent(streamBufferRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (renderTimerRef.current) clearInterval(renderTimerRef.current)
    }
  }, [])

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  )
  const selectedDoc = documents.find((d) =>
    selectedDocumentIds.includes(d.id)
  )

  // Load user avatar
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const email = user.email || ''
        setUserInitials(email.split('@')[0].substring(0, 2).toUpperCase())
        supabase
          .from('profiles')
          .select('avatar_url, full_name, display_name')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.avatar_url) setUserAvatar(data.avatar_url)
            if (data?.full_name) {
              setUserInitials(
                data.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              )
            } else if (data?.display_name) {
              setUserInitials(data.display_name.substring(0, 2).toUpperCase())
            }
          })
      }
    })
  }, [])

  // Smart auto-scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    shouldAutoScroll.current = distFromBottom < 120
  }, [])

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = '24px'
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }, [input])

  const loadConversation = async (conv: Conversation) => {
    setActiveConversationId(conv.id)
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
    setMessages((data as Message[]) || [])
    shouldAutoScroll.current = true
  }

  const startNewConversation = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: 'New conversation',
        document_id: selectedDocumentIds[0] || null,
      })
      .select()
      .single()

    if (error || !data) return
    addConversation(data as Conversation)
    setActiveConversationId(data.id)
    setMessages([])
    shouldAutoScroll.current = true
  }

  const refreshConversationTitle = async (convId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from('conversations').select('title').eq('id', convId).single()
    if (data?.title) updateConversationTitle(convId, data.title)
  }

  const sendMessage = async (content: string, convId: string, isFirst: boolean, imageDataUrls?: string[], fullContent?: string) => {
    setIsStreaming(true)
    startStreamRenderer()
    shouldAutoScroll.current = true

    try {
      console.log('[v0] Sending message:', { convId, content, documentIds: selectedDocumentIds })
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: convId,
          message: content,
          document_ids: selectedDocumentIds.length > 0 ? selectedDocumentIds : [],
          images: imageDataUrls || [],
          full_content: fullContent, // includes base64 images for persistence
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[v0] Chat API error:', res.status, errorText)
        throw new Error(`Failed to get response: ${res.status}`)
      }
      console.log('[v0] Chat API response ok')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                // Push to buffer — the renderer interval picks it up smoothly
                streamBufferRef.current += parsed.content
              }
            } catch { /* skip */ }
          }
        }
      }

      // Stream finished — flush any remaining buffer
      stopStreamRenderer()

      const finalContent = streamBufferRef.current.trim()
      if (finalContent) {
        addMessage({
          id: crypto.randomUUID(),
          conversation_id: convId,
          role: 'assistant',
          content: finalContent,
          created_at: new Date().toISOString(),
        })
        if (isFirst) setTimeout(() => refreshConversationTitle(convId), 1500)
      }
    } catch {
      stopStreamRenderer()
      addMessage({
        id: crypto.randomUUID(),
        conversation_id: convId,
        role: 'assistant',
        content: 'An error occurred while processing your request. Please try again.',
        created_at: new Date().toISOString(),
      })
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      streamBufferRef.current = ''
      displayedLengthRef.current = 0
    }
  }

  // Convert files to base64 data URLs for images
  const filesToDataUrls = async (files: AttachedFile[]): Promise<string[]> => {
    const urls: string[] = []
    for (const af of files) {
      if (af.file.type.startsWith('image/') && af.preview) {
        urls.push(af.preview)
      }
    }
    return urls
  }

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isStreaming) return

    let convId = activeConversationId

    if (!convId) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: 'New conversation',
          document_id: selectedDocumentIds[0] || null,
        })
        .select()
        .single()

      if (error || !data) return
      addConversation(data as Conversation)
      setActiveConversationId(data.id)
      convId = data.id
      isFirstMessage.current = true
    } else {
      isFirstMessage.current = messages.length === 0
    }

    // Build message content with image references
    let messageContent = input.trim()
    const imageNames = attachedFiles
      .filter((af) => af.file.type.startsWith('image/'))
      .map((af) => af.file.name)
    if (imageNames.length > 0 && !messageContent) {
      messageContent = `[Attached: ${imageNames.join(', ')}]`
    }

    // Build user message with any attached image previews stored in content
    const imageDataUrls = await filesToDataUrls(attachedFiles)
    const userMsgContent = imageDataUrls.length > 0
      ? `${messageContent}\n\n${imageDataUrls.map((url, i) => `![image-${i}](${url})`).join('\n')}`
      : messageContent

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: convId,
      role: 'user',
      content: userMsgContent,
      created_at: new Date().toISOString(),
    }

    addMessage(userMsg)
    const content = messageContent
    const fullContentWithImages = userMsgContent // includes embedded base64 images
    setInput('')
    setAttachedFiles([])
    if (textareaRef.current) textareaRef.current.style.height = '24px'

    await sendMessage(content, convId, isFirstMessage.current, imageDataUrls, fullContentWithImages)
  }

  const handleRegenerate = async (messageIndex: number) => {
    if (isStreaming) return
    const lastUserMsg = messages.slice(0, messageIndex).reverse().find((m) => m.role === 'user')
    if (!lastUserMsg || !activeConversationId) return

    const msgToRegenerate = messages[messageIndex]
    
    // Delete all messages after this one (since regenerating from this point)
    const messagesToDelete = messages.slice(messageIndex + 1)
    if (messagesToDelete.length > 0) {
      const supabase = createClient()
      for (const msg of messagesToDelete) {
        await supabase.from('messages').delete().eq('id', msg.id)
      }
      setMessages(messages.slice(0, messageIndex + 1))
    }

    // Store current content as a version before regenerating
    // Create a copy to avoid mutating state directly
    const existingVersions = msgToRegenerate.versions ? [...msgToRegenerate.versions] : []
    
    // If this is first regeneration, save the original as version 0
    if (existingVersions.length === 0) {
      existingVersions.push({
        id: crypto.randomUUID(),
        content: msgToRegenerate.content,
        created_at: msgToRegenerate.created_at,
      })
    }

    // Generate new response
    setIsStreaming(true)
    setRegeneratingMessageId(msgToRegenerate.id)
    startStreamRenderer()
    shouldAutoScroll.current = true

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConversationId,
          message: lastUserMsg.content,
          document_ids: selectedDocumentIds.length > 0 ? selectedDocumentIds : [],
          images: [],
          regenerate: true, // Flag to not save user message again
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                streamBufferRef.current += parsed.content
              }
            } catch { /* skip */ }
          }
        }
      }

      stopStreamRenderer()
      const newContent = streamBufferRef.current.trim()

      if (newContent && newContent !== msgToRegenerate.content) {
        // Add new version
        const newVersion = {
          id: crypto.randomUUID(),
          content: newContent,
          created_at: new Date().toISOString(),
        }
        const updatedVersions = [...existingVersions, newVersion]
        
        // Update message with new content and versions
        updateMessage(msgToRegenerate.id, {
          content: newContent,
          versions: updatedVersions,
          activeVersionIndex: updatedVersions.length - 1,
        })

        // Also update local messages state to ensure UI reflects change
        updateMessage(msgToRegenerate.id, {
          content: newContent,
          versions: updatedVersions,
          activeVersionIndex: updatedVersions.length - 1,
        })

        // Update in database (store latest content)
        const supabase = createClient()
        await supabase.from('messages').update({ content: newContent }).eq('id', msgToRegenerate.id)
      }
    } catch {
      // On error, keep original content
    } finally {
      setIsStreaming(false)
      setRegeneratingMessageId(null)
      setStreamingContent('')
      streamBufferRef.current = ''
      displayedLengthRef.current = 0
    }
  }

  const handleVersionChange = (messageId: string, newIndex: number) => {
    const msg = messages.find((m) => m.id === messageId)
    if (!msg || !msg.versions || newIndex < 0 || newIndex >= msg.versions.length) return

    const newContent = msg.versions[newIndex].content
    updateMessage(messageId, {
      content: newContent,
      activeVersionIndex: newIndex,
    })

    // Update in database
    const supabase = createClient()
    supabase.from('messages').update({ content: newContent }).eq('id', messageId).then(() => {})
  }

  const handleEditMessage = async (messageIndex: number) => {
    if (isStreaming || !activeConversationId) return
    const msgToEdit = messages[messageIndex]
    if (msgToEdit.role !== 'user') return

    // Extract text and images separately
    const { text, images } = extractImages(msgToEdit.content)
    setInput(text)
    setEditingMessageId(msgToEdit.id)
    setEditingImages(images) // Store images to re-attach when sending

    // Focus the textarea
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const handleSendEditedMessage = async () => {
    if (!editingMessageId || !activeConversationId || isStreaming) return

    const editIndex = messages.findIndex((m) => m.id === editingMessageId)
    if (editIndex === -1) return

    // Delete this message and all messages after it
    const messagesToDelete = messages.slice(editIndex)
    const supabase = createClient()

    for (const msg of messagesToDelete) {
      await supabase.from('messages').delete().eq('id', msg.id)
    }

    // Update local state
    setMessages(messages.slice(0, editIndex))
    
    // Store images before clearing state
    const imagesToReattach = [...editingImages]
    setEditingMessageId(null)
    setEditingImages([])

    // Build message content with preserved images
    let messageContent = input.trim()
    const userMsgContent = imagesToReattach.length > 0
      ? `${messageContent}\n\n${imagesToReattach.map((url, i) => `![image-${i}](${url})`).join('\n')}`
      : messageContent

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: activeConversationId,
      role: 'user',
      content: userMsgContent,
      created_at: new Date().toISOString(),
    }

    addMessage(userMsg)
    setInput('')
    setAttachedFiles([])
    if (textareaRef.current) textareaRef.current.style.height = '24px'

    // Send to API
    await sendMessage(messageContent, activeConversationId, false, imagesToReattach, userMsgContent)
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const valid = files.filter((f) => {
      if (f.type.startsWith('video/')) return false
      if (f.size > 50 * 1024 * 1024) return false
      return true
    })

    for (const f of valid) {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          setAttachedFiles((prev) => [...prev, { file: f, preview: reader.result as string }])
        }
        reader.readAsDataURL(f)
      } else {
        setAttachedFiles((prev) => [...prev, { file: f }])
      }
    }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }, [])

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearAllFiles = useCallback(() => {
    setAttachedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          {activeConversation ? (
            <EditableTitle
              title={activeConversation.title}
              onSave={(newTitle) => {
                updateConversationTitle(activeConversation.id, newTitle)
                const supabase = createClient()
                supabase.from('conversations').update({ title: newTitle }).eq('id', activeConversation.id).then(() => {})
              }}
            />
          ) : (
            <p className="truncate font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Study Mode
            </p>
          )}
          {selectedDoc && (
            <p className="flex items-center gap-1 truncate font-mono text-[9px] text-muted-foreground">
              <FileText className="h-2.5 w-2.5 shrink-0" />
              {selectedDoc.title}
            </p>
          )}
        </div>
        <Button
          onClick={startNewConversation}
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 rounded-md border-border font-mono text-[10px] uppercase tracking-wider"
        >
          <Plus className="h-3 w-3" />
          New
        </Button>
      </div>
      <Separator className="shrink-0" />

      {/* Messages Area — the only scrollable region */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="mx-auto max-w-3xl px-3 py-4 md:px-6">
          {messages.length === 0 && !streamingContent && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <ZequelAvatar size={56} />
              <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {activeConversationId ? 'Start the conversation' : 'Study Mode'}
              </p>
              <p className="mt-2 max-w-sm text-center font-sans text-xs leading-relaxed text-muted-foreground/60">
                {selectedDoc
                  ? `Ask questions about "${selectedDoc.title}", solve problems, or explore any topic.`
                  : 'Ask questions, solve math, write code, or explore any topic. Select a document for contextual analysis.'}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              userAvatar={userAvatar}
              userInitials={userInitials}
              isRegenerating={regeneratingMessageId === msg.id}
              onRegenerate={
                msg.role === 'assistant' && !isStreaming ? () => handleRegenerate(i) : undefined
              }
              onEdit={
                msg.role === 'user' && !isStreaming ? () => handleEditMessage(i) : undefined
              }
              onVersionChange={
                msg.role === 'assistant' && msg.versions && msg.versions.length > 1
                  ? (newIndex: number) => handleVersionChange(msg.id, newIndex)
                  : undefined
              }
            />
          ))}

          {/* Streaming response — typing effect */}
          {isStreaming && streamingContent && (
            <div className="mb-6 flex gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
                <img
                  src="/zequel-logo-new.png"
                  alt="Zequel"
                  className="h-5 w-5"
                />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden pt-0.5">
                <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Zequel
                </p>
                <div className="prose-zequel">
                  <MarkdownRenderer content={streamingContent} />
                  <span className="ml-0.5 inline-block h-[18px] w-[2px] animate-pulse bg-foreground/70" />
                </div>
              </div>
            </div>
          )}

          {/* Thinking indicator */}
          {isStreaming && !streamingContent && (
            <div className="mb-6 flex gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
                <img
                  src="/zequel-logo-new.png"
                  alt="Zequel"
                  className="h-5 w-5"
                />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Zequel
                </p>
                <div className="flex items-center gap-2 py-1">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area — pinned at bottom, never scrolls */}
      <div className="shrink-0 border-t border-border bg-background px-3 pb-[env(safe-area-inset-bottom)] md:px-6">
        {/* Editing indicator */}
        {editingMessageId && (
          <div className="flex items-center gap-2 px-1 pt-2">
            <Pencil className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
              Editing message
            </span>
          </div>
        )}
        {/* Editing images preview */}
        {editingImages.length > 0 && editingMessageId && (
          <div className="flex flex-wrap items-center gap-2 px-1 pt-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Attached:
            </span>
            {editingImages.map((src, i) => (
              <div
                key={i}
                className="group relative flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1.5"
              >
                <img
                  src={src}
                  alt={`Attached image ${i + 1}`}
                  className="h-10 w-10 rounded object-cover"
                />
                <button
                  onClick={() => setEditingImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-1 pt-2">
            {attachedFiles.length > 1 && (
              <button
                onClick={clearAllFiles}
                className="flex h-8 items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
            {attachedFiles.map((af, i) => (
              <div
                key={i}
                className="group relative flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2 py-1.5"
              >
                {af.preview ? (
                  <img
                    src={af.preview}
                    alt={af.file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : af.file.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {!af.preview && (
                  <span className="max-w-[100px] truncate font-mono text-[10px] text-foreground">
                    {af.file.name}
                  </span>
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background transition-opacity"
                  aria-label={`Remove ${af.file.name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mx-auto flex max-w-3xl items-end gap-2 py-2.5">
          <div className="flex min-h-[44px] flex-1 items-end rounded-xl border border-border bg-secondary/30 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mb-2.5 ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-foreground"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Zequel..."
              disabled={isStreaming}
              rows={1}
              className="max-h-[160px] min-h-[24px] flex-1 resize-none bg-transparent px-2 py-2.5 font-sans text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-50"
              onKeyDown={() => {
                // Enter creates a new paragraph naturally — send via button only
              }}
            />
            <button
              onClick={editingMessageId ? handleSendEditedMessage : handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || isStreaming}
              className="mb-2.5 mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-20"
              aria-label={editingMessageId ? "Save edit" : "Send message"}
            >
              {isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : editingMessageId ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
            {editingMessageId && (
              <button
                onClick={() => { setEditingMessageId(null); setEditingImages([]); setInput('') }}
                className="mb-2.5 mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Cancel edit"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Editable title component */
function EditableTitle({ title, onSave }: { title: string; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setValue(title) }, [title])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const save = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== title) onSave(trimmed)
    else setValue(title)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') { setValue(title); setEditing(false) }
          }}
          onBlur={save}
          className="min-w-0 flex-1 rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground outline-none focus:ring-1 focus:ring-ring"
        />
        <button onMouseDown={(e) => { e.preventDefault(); save() }} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground">
          <Check className="h-3 w-3" />
        </button>
        <button onMouseDown={(e) => { e.preventDefault(); setValue(title); setEditing(false) }} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)} className="group flex items-center gap-1.5 truncate">
      <span className="truncate font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">{title}</span>
      <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
    </button>
  )
}

/* Extract images from message content (markdown image syntax) */
function extractImages(content: string): { text: string; images: string[] } {
  const imgRegex = /!\[image-\d+\]\((data:image\/[^)]+)\)/g
  const images: string[] = []
  let match
  while ((match = imgRegex.exec(content)) !== null) {
    images.push(match[1])
  }
  const text = content.replace(imgRegex, '').trim()
  return { text, images }
}

/* Chat message component */
function ChatMessage({
  message,
  userAvatar,
  userInitials,
  isRegenerating,
  onRegenerate,
  onEdit,
  onVersionChange,
}: {
  message: Message
  userAvatar: string | null
  userInitials: string
  isRegenerating?: boolean
  onRegenerate?: () => void
  onEdit?: () => void
  onVersionChange?: (newIndex: number) => void
}) {
  const hasVersions = message.versions && message.versions.length > 1
  const activeVersionIndex = message.activeVersionIndex ?? 0
  const totalVersions = message.versions?.length ?? 1
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)

  const { text: displayText, images: userImages } = isUser
    ? extractImages(message.content)
    : { text: message.content, images: [] }

  const copyContent = () => {
    const textOnly = isUser ? displayText : message.content
    navigator.clipboard.writeText(textOnly).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    setShowMenu(false)
  }

  // Long press detection — only for user messages, cancel if moved more than 10px
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isUser) return
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true)
    }, 500)
  }, [isUser])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!longPressTimer.current || !touchStartPos.current) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchStartPos.current.x)
    const dy = Math.abs(touch.clientY - touchStartPos.current.y)
    // If moved more than 10px, cancel long press (user is scrolling)
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
      touchStartPos.current = null
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  if (isUser) {
    return (
      <div className="group/msg mb-4 flex justify-end">
        <div className="flex max-w-[85%] flex-row-reverse gap-2.5 md:max-w-[75%]">
          <Avatar className="mt-0.5 h-6 w-6 shrink-0 border border-border">
            {userAvatar && <AvatarImage src={userAvatar} alt="You" />}
            <AvatarFallback className="bg-secondary font-mono text-[8px] text-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="relative">
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onContextMenu={(e) => { e.preventDefault(); setShowMenu(true) }}
              className="cursor-default select-text rounded-2xl rounded-tr-sm bg-foreground/10 px-3.5 py-2.5"
            >
              {userImages.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {userImages.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Attached image ${i + 1}`}
                      className="max-h-48 max-w-[200px] rounded-lg border border-border object-contain"
                    />
                  ))}
                </div>
              )}
              {displayText && (
                <p className="whitespace-pre-wrap break-words font-sans text-[14px] leading-[1.65] text-foreground">
                  {displayText}
                </p>
              )}
            </div>
            {/* User message menu - positioned absolutely */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border bg-background p-1 shadow-lg">
                  <button
                    onClick={copyContent}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-foreground hover:bg-secondary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                  <button
                    onClick={() => { setShowMenu(false) }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-foreground hover:bg-secondary"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                  {onEdit && (
                    <button
                      onClick={() => { setShowMenu(false); onEdit() }}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-foreground hover:bg-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // AI message — left-aligned with Zequel logo
  return (
    <div className="group/msg mb-6 flex gap-2.5">
      <ZequelAvatar size={24} className="mt-0.5" />

      <div className="min-w-0 flex-1 overflow-hidden pt-0.5">
        <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Zequel
        </p>
        {isRegenerating ? (
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3">
              <div className="relative h-5 w-5">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/50" />
                <Loader2 className="absolute inset-0 h-5 w-5 animate-spin text-primary" />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
                Generating new response...
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted/50" />
              <div className="h-3 w-full animate-pulse rounded bg-muted/40" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted/30" />
            </div>
          </div>
        ) : (
          <div className="prose-zequel">
            <MarkdownRenderer content={message.content} />
          </div>
        )}
        {/* Action icons row */}
        <div className="mt-2.5 flex items-center gap-0.5">
          {onRegenerate && (
            <button onClick={onRegenerate} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground" title="Regenerate">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          {/* Version navigation — only shows if multiple versions exist */}
          {hasVersions && onVersionChange && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onVersionChange(activeVersionIndex - 1)}
                disabled={activeVersionIndex === 0}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/40"
                title="Previous version"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[32px] text-center font-mono text-[10px] text-muted-foreground">
                {activeVersionIndex + 1}/{totalVersions}
              </span>
              <button
                onClick={() => onVersionChange(activeVersionIndex + 1)}
                disabled={activeVersionIndex === totalVersions - 1}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/40"
                title="Next version"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button onClick={copyContent} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground" title="Copy">
            {copied ? <Check className="h-3.5 w-3.5 text-foreground" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground" title="Share">
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground" title="More">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px] border-border bg-background">
              <DropdownMenuItem className="gap-2 font-mono text-[11px] uppercase tracking-wider">
                <GitBranch className="h-3.5 w-3.5" />
                Branch in new chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

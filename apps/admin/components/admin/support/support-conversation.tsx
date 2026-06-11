"use client"

import { useState } from "react"
import {
  Mail,
  MessageSquareReply,
  Paperclip,
  StickyNote,
  Send,
  Save,
  CircleDot,
  UserCheck,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Bug,
  ImageIcon,
  FileText,
} from "lucide-react"
import { Button } from "@zequel/ui/components/button"
import { Textarea } from "@zequel/ui/components/textarea"
import { StatusPill } from "@/components/admin/status-pill"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/admin-dashboard/format"
import {
  SOURCE_LABEL,
  STATUS_PILL,
  type SupportTicketDetail,
  type TimelineItem,
} from "@/lib/admin-dashboard/support-center"

type Composer = "admin" | "email" | "note"

const EVENT_ICON: Record<string, typeof CircleDot> = {
  "Ticket Created": CircleDot,
  "Assigned to Admin": UserCheck,
  "Forwarded to Super Admin": UserCheck,
  Resolved: CheckCircle2,
  Reopened: RotateCcw,
  Closed: XCircle,
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function SystemEvent({ item }: { item: TimelineItem }) {
  const Icon = (item.event && EVENT_ICON[item.event]) || CircleDot
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3" />
        {item.event || "Event"}
        <span className="text-muted-foreground/70">· {formatDateTime(item.createdAt)}</span>
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function AttachmentChip({ name, size, kind }: { name: string; size: string; kind: "image" | "file" }) {
  const Icon = kind === "image" ? ImageIcon : FileText
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-xs text-foreground">{name}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{size}</span>
    </div>
  )
}

function MessageBubble({ item }: { item: TimelineItem }) {
  const isAdmin = item.kind === "admin" || item.kind === "email"
  const isNote = item.kind === "note"

  return (
    <div className={cn("flex gap-3", isAdmin && "flex-row-reverse")}>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-semibold",
          isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
        )}
      >
        {initials(item.author)}
      </span>

      <div className={cn("flex max-w-[78%] flex-col gap-1", isAdmin && "items-end")}>
        <div className={cn("flex items-center gap-2", isAdmin && "flex-row-reverse")}>
          <span className="text-xs font-medium text-foreground">{item.author}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{formatDateTime(item.createdAt)}</span>
          {item.kind === "email" && (
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              <Mail className="size-2.5" /> Email
            </span>
          )}
        </div>

        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm leading-relaxed",
            isNote
              ? "border-foreground/20 bg-secondary/40 text-foreground"
              : isAdmin
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
          )}
        >
          {isNote && (
            <span className="mb-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              <StickyNote className="size-2.5" /> Internal note · staff only
            </span>
          )}
          {item.emailMeta && (
            <p className="mb-1 font-mono text-[10px] text-primary-foreground/70">
              To: {item.emailMeta.to} · {item.emailMeta.subject}
            </p>
          )}
          <p className="whitespace-pre-wrap text-pretty">{item.body}</p>
        </div>

        {item.attachments && item.attachments.length > 0 && (
          <div className={cn("flex flex-wrap gap-1.5", isAdmin && "justify-end")}>
            {item.attachments.map((a) => (
              <AttachmentChip key={a.id} name={a.name} size={a.size} kind={a.kind} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function SupportConversation({
  ticket,
  loading,
  busy,
  onSend,
  onStatus,
}: {
  ticket: SupportTicketDetail | null
  loading?: boolean
  busy?: boolean
  onSend: (kind: Composer, body: string) => void
  onStatus: (status: SupportTicketDetail["status"], label: string) => void
}) {
  const [composer, setComposer] = useState<Composer>("admin")
  const [body, setBody] = useState("")

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-secondary/70" />
        <div className="mt-4 h-16 w-3/4 animate-pulse rounded-lg bg-secondary/50" />
        <div className="ml-auto h-16 w-2/3 animate-pulse rounded-lg bg-secondary/40" />
        <div className="h-16 w-3/4 animate-pulse rounded-lg bg-secondary/50" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <MessageSquareReply className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Select a ticket</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Choose a ticket from the list to view its full conversation history and reply to the user.
        </p>
      </div>
    )
  }

  const valid = body.trim().length > 1
  const isClosed = ticket.status === "closed"
  const isResolved = ticket.status === "resolved"

  function submit() {
    if (!valid) return
    onSend(composer, body.trim())
    setBody("")
  }

  const composerMeta: Record<Composer, { placeholder: string; cta: string; icon: typeof Send }> = {
    admin: {
      placeholder: `Reply to ${ticket.userName} — this will email ${ticket.userEmail}`,
      cta: "Send Reply",
      icon: Send,
    },
    email: {
      placeholder: `Compose an email to ${ticket.userEmail}`,
      cta: "Send Email",
      icon: Mail,
    },
    note: {
      placeholder: "Add an internal note — visible to staff only, never sent to the user",
      cta: "Save Note",
      icon: StickyNote,
    },
  }
  const meta = composerMeta[composer]
  const Cta = meta.icon

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Conversation header */}
      <div className="shrink-0 border-b border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground">{ticket.subject}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] text-muted-foreground">{ticket.ref}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-[11px] text-muted-foreground">{SOURCE_LABEL[ticket.source]}</span>
              <StatusPill status={STATUS_PILL[ticket.status]} />
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            {isClosed || isResolved ? (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => onStatus("open", "reopened")}>
                <RotateCcw className="size-3.5" /> Reopen
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => onStatus("resolved", "marked resolved")}>
                <CheckCircle2 className="size-3.5" /> Resolve
              </Button>
            )}
          </div>
        </div>

        {ticket.bug && (
          <div className="mt-3 rounded-md border border-border bg-secondary/40 p-3">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Bug className="size-3" /> Bug Report Context
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
              <Meta label="Browser" value={ticket.bug.browser} />
              <Meta label="Device" value={ticket.bug.device} />
              <Meta label="OS" value={ticket.bug.os} />
              <Meta label="Page" value={ticket.bug.currentPage} />
              {ticket.bug.screenshot && <Meta label="Screenshot" value={ticket.bug.screenshot} />}
            </dl>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {ticket.timeline.map((item) =>
          item.kind === "system" ? (
            <SystemEvent key={item.id} item={item} />
          ) : (
            <MessageBubble key={item.id} item={item} />
          ),
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="mb-2 flex items-center gap-1">
          <ComposerTab active={composer === "admin"} onClick={() => setComposer("admin")} icon={MessageSquareReply}>
            Reply
          </ComposerTab>
          <ComposerTab active={composer === "email"} onClick={() => setComposer("email")} icon={Mail}>
            Email
          </ComposerTab>
          <ComposerTab active={composer === "note"} onClick={() => setComposer("note")} icon={StickyNote}>
            Internal Note
          </ComposerTab>
        </div>

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={meta.placeholder}
          className={cn(
            "min-h-[88px] resize-none text-sm",
            composer === "note" && "border-foreground/20 bg-secondary/30",
          )}
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Paperclip className="size-4" /> Attach
          </Button>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" disabled={!valid || busy} onClick={() => setBody("")}>
              <Save className="size-3.5" /> Save Draft
            </Button>
            <Button size="sm" disabled={!valid || busy} onClick={submit}>
              <Cta className="size-3.5" /> {meta.cta}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate text-foreground">{value}</dd>
    </div>
  )
}

function ComposerTab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Send
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  )
}

"use client"

import { Search } from "lucide-react"
import { Input } from "@zequel/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zequel/ui/components/select"
import { StatusPill } from "@/components/admin/status-pill"
import { relativeTime } from "@/lib/admin-dashboard/format"
import { cn } from "@/lib/utils"
import {
  SOURCE_LABEL,
  STATUS_PILL,
  type SupportTicketSummary,
} from "@/lib/admin-dashboard/support-center"

export type SortKey = "newest" | "updated"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function TicketCard({
  ticket,
  active,
  onClick,
}: {
  ticket: SupportTicketSummary
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-2 border-b border-border px-4 py-3 text-left transition-colors",
        active ? "bg-secondary" : "hover:bg-secondary/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {ticket.unread && (
            <span className="size-1.5 shrink-0 rounded-full bg-foreground" aria-label="Unread" />
          )}
          <span className="truncate text-sm font-medium text-foreground">{ticket.subject}</span>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {relativeTime(ticket.lastActivityAt)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary-foreground/10 font-mono text-[8px] font-semibold text-foreground">
          {initials(ticket.userName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-foreground">{ticket.userName}</p>
        </div>
        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">{ticket.ref}</span>
      </div>

      <p className="line-clamp-1 text-xs text-muted-foreground">{ticket.preview}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusPill status={STATUS_PILL[ticket.status]} />
        <span className="rounded-md border border-border bg-transparent px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {SOURCE_LABEL[ticket.source]}
        </span>
      </div>
    </button>
  )
}

export function SupportTicketList({
  tickets,
  loading,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sourceFilter,
  onSourceChange,
  sort,
  onSortChange,
  title,
}: {
  tickets: SupportTicketSummary[]
  loading?: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
  sourceFilter: string
  onSourceChange: (v: string) => void
  sort: SortKey
  onSortChange: (v: SortKey) => void
  title: string
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <span className="font-mono text-[11px] text-muted-foreground">{tickets.length} tickets</span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tickets, users, IDs..."
            className="h-9 pl-9 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="waiting_for_user">Waiting</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={onSourceChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="support_email">Support Email</SelectItem>
              <SelectItem value="information_request">Info Requests</SelectItem>
              <SelectItem value="bug_report">Bug Reports</SelectItem>
              <SelectItem value="contact_form">Contact Forms</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="updated">Last Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && tickets.length === 0 ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-secondary/70" />
                <div className="h-2.5 w-2/3 animate-pulse rounded bg-secondary/50" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="text-sm text-muted-foreground">No tickets match your filters.</p>
          </div>
        ) : (
          tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} active={t.id === selectedId} onClick={() => onSelect(t.id)} />
          ))
        )}
      </div>
    </div>
  )
}

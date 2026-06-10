"use client"

import { useMemo, useState } from "react"
import {
  LifeBuoy,
  MessageSquareReply,
  Flag,
  CircleCheck,
  RotateCcw,
  Plus,
  MoreHorizontal,
  Clock,
  Mail,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zequel/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zequel/ui/components/dropdown-menu"
import { Button } from "@zequel/ui/components/button"
import { Label } from "@zequel/ui/components/label"
import { Input } from "@zequel/ui/components/input"
import { Textarea } from "@zequel/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zequel/ui/components/select"
import { StatusPill, PriorityPill } from "@/components/admin/status-pill"
import { formatDate, relativeTime } from "@/lib/admin-dashboard/format"
import type { SupportTicket } from "@/lib/admin-dashboard/types"

type Priority = SupportTicket["priority"]
type Status = SupportTicket["status"]
type Category = SupportTicket["category"]

const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"]
const STATUSES: Status[] = ["open", "pending", "resolved", "closed"]
const CATEGORIES: Category[] = ["bug", "billing", "feature", "account", "other"]

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
}
const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
}
const CATEGORY_LABEL: Record<Category, string> = {
  bug: "Bug",
  billing: "Billing",
  feature: "Feature",
  account: "Account",
  other: "Other",
}

export interface TicketPatch {
  priority?: Priority
  status?: Status
}

type DialogKind = "view" | "reply" | "priority" | "status" | null

export function TicketRowActions({
  ticket,
  onPatch,
  onReply,
}: {
  ticket: SupportTicket
  onPatch: (id: string, patch: TicketPatch, message: string) => void
  onReply: (id: string, message: string) => void
}) {
  const [dialog, setDialog] = useState<DialogKind>(null)
  const close = () => setDialog(null)
  const isClosed = ticket.status === "closed" || ticket.status === "resolved"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Ticket actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("view")}>View ticket</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("reply")}>Reply</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialog("priority")}>Change priority</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("status")}>Change status</DropdownMenuItem>
          <DropdownMenuSeparator />
          {isClosed ? (
            <DropdownMenuItem
              onSelect={() => onPatch(ticket.id, { status: "open" }, `${ticket.id} reopened`)}
            >
              Reopen ticket
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => onPatch(ticket.id, { status: "resolved" }, `${ticket.id} marked resolved`)}
            >
              Mark resolved
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewTicketDialog open={dialog === "view"} onClose={close} ticket={ticket} onPatch={onPatch} />
      <ReplyDialog open={dialog === "reply"} onClose={close} ticket={ticket} onReply={onReply} />
      <PriorityDialog open={dialog === "priority"} onClose={close} ticket={ticket} onPatch={onPatch} />
      <StatusDialog open={dialog === "status"} onClose={close} ticket={ticket} onPatch={onPatch} />
    </>
  )
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
}

function ViewTicketDialog({
  open,
  onClose,
  ticket,
  onPatch,
}: {
  open: boolean
  onClose: () => void
  ticket: SupportTicket
  onPatch: (id: string, patch: TicketPatch, message: string) => void
}) {
  const isClosed = ticket.status === "closed" || ticket.status === "resolved"
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-pretty">{ticket.subject}</DialogTitle>
          <DialogDescription className="font-mono text-[11px]">{ticket.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-semibold text-foreground">
              {initials(ticket.user)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{ticket.user}</p>
              <p className="truncate text-xs text-muted-foreground">{ticket.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={ticket.status} />
            <PriorityPill priority={ticket.priority} />
            <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {CATEGORY_LABEL[ticket.category]}
            </span>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-foreground">{formatDate(ticket.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" /> Last update
              </dt>
              <dd className="text-foreground">{relativeTime(ticket.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isClosed ? (
            <Button onClick={() => (onPatch(ticket.id, { status: "open" }, `${ticket.id} reopened`), onClose())}>
              <RotateCcw className="size-4" /> Reopen
            </Button>
          ) : (
            <Button
              onClick={() => (onPatch(ticket.id, { status: "resolved" }, `${ticket.id} marked resolved`), onClose())}
            >
              <CircleCheck className="size-4" /> Mark resolved
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReplyDialog({
  open,
  onClose,
  ticket,
  onReply,
}: {
  open: boolean
  onClose: () => void
  ticket: SupportTicket
  onReply: (id: string, message: string) => void
}) {
  const [body, setBody] = useState("")
  const valid = body.trim().length > 1

  function send() {
    onReply(ticket.id, `Reply sent to ${ticket.user}`)
    setBody("")
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setBody("")
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareReply className="size-4" />
            Reply to ticket
          </DialogTitle>
          <DialogDescription>
            {ticket.user} · {ticket.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground">Subject</p>
            <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reply-body">Message</Label>
            <Textarea
              id="reply-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your response to the requester..."
              className="min-h-[120px] resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={send} disabled={!valid}>
            <Mail className="size-4" /> Send reply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PriorityDialog({
  open,
  onClose,
  ticket,
  onPatch,
}: {
  open: boolean
  onClose: () => void
  ticket: SupportTicket
  onPatch: (id: string, patch: TicketPatch, message: string) => void
}) {
  const [priority, setPriority] = useState<Priority>(ticket.priority)
  const changed = priority !== ticket.priority

  function save() {
    onPatch(ticket.id, { priority }, `${ticket.id} set to ${PRIORITY_LABEL[priority]} priority`)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
        else setPriority(ticket.priority)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-4" />
            Change priority
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px]">{ticket.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="priority-select">Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger id="priority-select" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!changed}>
            Save priority
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatusDialog({
  open,
  onClose,
  ticket,
  onPatch,
}: {
  open: boolean
  onClose: () => void
  ticket: SupportTicket
  onPatch: (id: string, patch: TicketPatch, message: string) => void
}) {
  const [status, setStatus] = useState<Status>(ticket.status)
  const changed = status !== ticket.status

  function save() {
    onPatch(ticket.id, { status }, `${ticket.id} set to ${STATUS_LABEL[status]}`)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
        else setStatus(ticket.status)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleCheck className="size-4" />
            Change status
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px]">{ticket.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="status-select">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger id="status-select" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!changed}>
            Save status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NewTicketDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreate: (ticket: SupportTicket, message: string) => void
}) {
  const [subject, setSubject] = useState("")
  const [user, setUser] = useState("")
  const [email, setEmail] = useState("")
  const [category, setCategory] = useState<Category>("bug")
  const [priority, setPriority] = useState<Priority>("normal")
  const [description, setDescription] = useState("")

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email])
  const valid = subject.trim().length > 2 && user.trim().length > 1 && emailValid

  function reset() {
    setSubject("")
    setUser("")
    setEmail("")
    setCategory("bug")
    setPriority("normal")
    setDescription("")
  }

  function create() {
    const now = new Date().toISOString()
    const ticket: SupportTicket = {
      id: `tkt_${Math.random().toString(36).slice(2, 7)}`,
      subject: subject.trim(),
      user: user.trim(),
      email: email.trim().toLowerCase(),
      priority,
      status: "open",
      category,
      createdAt: now,
      updatedAt: now,
    }
    onCreate(ticket, `Ticket ${ticket.id} created`)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="size-4" />
            New ticket
          </DialogTitle>
          <DialogDescription>Log a ticket on behalf of a user.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Cannot export research report"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ticket-user">Requester</Label>
              <Input
                id="ticket-user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-email">Email</Label>
              <Input
                id="ticket-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
          </div>
          {email.length > 0 && !emailValid && (
            <p className="text-xs text-destructive">Enter a valid email address.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ticket-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger id="ticket-category" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="ticket-priority" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the user experiencing?"
              className="min-h-[80px] resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={create} disabled={!valid}>
            <Plus className="size-4" /> Create ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

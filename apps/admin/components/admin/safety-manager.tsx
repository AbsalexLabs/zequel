"use client"

import { useState } from "react"
import {
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CircleSlash,
  User,
  Clock,
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
import { Textarea } from "@zequel/ui/components/textarea"
import { StatusPill, SeverityPill } from "@/components/admin/status-pill"
import { formatDateTime, relativeTime } from "@/lib/admin-dashboard/format"
import type { SafetyEvent } from "@/lib/admin-dashboard/types"

type Action = SafetyEvent["action"]

const CATEGORY_LABEL: Record<string, string> = {
  harmful: "Harmful content",
  pii: "PII exposure",
  jailbreak: "Jailbreak attempt",
  spam: "Spam / abuse",
  abuse: "Harassment",
}

export interface SafetyPatch {
  action?: Action
}

type DialogKind = "view" | "dismiss" | null

export function SafetyRowActions({
  event,
  onPatch,
}: {
  event: SafetyEvent
  onPatch: (id: string, patch: SafetyPatch, message: string) => void
}) {
  const [dialog, setDialog] = useState<DialogKind>(null)
  const close = () => setDialog(null)
  const isResolved = event.action === "reviewed" || event.action === "dismissed"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Safety event actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("view")}>View event</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => onPatch(event.id, { action: "reviewed" }, `${event.id} marked reviewed`)}
            disabled={event.action === "reviewed"}
          >
            Mark reviewed
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => onPatch(event.id, { action: "blocked" }, `${event.id} blocked`)}
            disabled={event.action === "blocked"}
          >
            Block user action
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialog("dismiss")} disabled={isResolved}>
            Dismiss
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewSafetyDialog open={dialog === "view"} onClose={close} event={event} onPatch={onPatch} />
      <DismissDialog open={dialog === "dismiss"} onClose={close} event={event} onPatch={onPatch} />
    </>
  )
}

function ViewSafetyDialog({
  open,
  onClose,
  event,
  onPatch,
}: {
  open: boolean
  onClose: () => void
  event: SafetyEvent
  onPatch: (id: string, patch: SafetyPatch, message: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4" />
            {CATEGORY_LABEL[event.category] ?? event.category}
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px]">{event.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityPill severity={event.severity} />
            <StatusPill status={event.action} />
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground">Detail</p>
            <p className="mt-1 text-sm text-foreground">{event.detail}</p>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <User className="size-3.5" /> User
              </dt>
              <dd className="text-foreground">{event.user}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" /> Detected
              </dt>
              <dd className="text-foreground">{formatDateTime(event.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Age</dt>
              <dd className="text-foreground">{relativeTime(event.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => (onPatch(event.id, { action: "reviewed" }, `${event.id} marked reviewed`), onClose())}
            disabled={event.action === "reviewed"}
          >
            <ShieldCheck className="size-4" /> Reviewed
          </Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => (onPatch(event.id, { action: "blocked" }, `${event.id} blocked`), onClose())}
            disabled={event.action === "blocked"}
          >
            <Ban className="size-4" /> Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DismissDialog({
  open,
  onClose,
  event,
  onPatch,
}: {
  open: boolean
  onClose: () => void
  event: SafetyEvent
  onPatch: (id: string, patch: SafetyPatch, message: string) => void
}) {
  const [reason, setReason] = useState("")

  function confirm() {
    onPatch(event.id, { action: "dismissed" }, `${event.id} dismissed`)
    setReason("")
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setReason("")
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleSlash className="size-4" />
            Dismiss event
          </DialogTitle>
          <DialogDescription>
            Mark this signal as a false positive. It will be excluded from open review queues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="dismiss-reason">
            Reason <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="dismiss-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Recorded in the audit log"
            className="min-h-[64px] resize-none text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm}>Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

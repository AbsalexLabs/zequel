"use client"

import { useState } from "react"
import {
  MoreHorizontal,
  MessageSquare,
  Archive,
  ArchiveRestore,
  Flag,
  FlagOff,
  Download,
  FileText,
  Hash,
  Clock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/admin/status-pill"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { Conversation } from "@/lib/admin-dashboard/types"

type Status = Conversation["status"]

export interface ConversationPatch {
  status?: Status
}

type DialogKind = "view" | null

export function ConversationRowActions({
  conversation,
  onPatch,
  onExport,
}: {
  conversation: Conversation
  onPatch: (id: string, patch: ConversationPatch, message: string) => void
  onExport: (id: string, message: string) => void
}) {
  const [dialog, setDialog] = useState<DialogKind>(null)
  const close = () => setDialog(null)
  const isArchived = conversation.status === "archived"
  const isFlagged = conversation.status === "flagged"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Conversation actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("view")}>View conversation</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onExport(conversation.id, `${conversation.id} exported`)}>
            Export transcript
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isArchived ? (
            <DropdownMenuItem
              onSelect={() => onPatch(conversation.id, { status: "active" }, `${conversation.id} restored`)}
            >
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => onPatch(conversation.id, { status: "archived" }, `${conversation.id} archived`)}
            >
              Archive
            </DropdownMenuItem>
          )}
          {isFlagged ? (
            <DropdownMenuItem
              onSelect={() => onPatch(conversation.id, { status: "active" }, `${conversation.id} unflagged`)}
            >
              Clear flag
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => onPatch(conversation.id, { status: "flagged" }, `${conversation.id} flagged for review`)}
            >
              Flag for review
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewConversationDialog
        open={dialog === "view"}
        onClose={close}
        conversation={conversation}
        onPatch={onPatch}
        onExport={onExport}
      />
    </>
  )
}

function ViewConversationDialog({
  open,
  onClose,
  conversation,
  onPatch,
  onExport,
}: {
  open: boolean
  onClose: () => void
  conversation: Conversation
  onPatch: (id: string, patch: ConversationPatch, message: string) => void
  onExport: (id: string, message: string) => void
}) {
  const isArchived = conversation.status === "archived"
  const isFlagged = conversation.status === "flagged"
  const stats = [
    { label: "Messages", value: formatNumber(conversation.messages), icon: MessageSquare },
    { label: "Documents", value: formatNumber(conversation.documents), icon: FileText },
    { label: "Tokens", value: formatNumber(conversation.tokens), icon: Hash },
  ]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-pretty">{conversation.title}</DialogTitle>
          <DialogDescription className="font-mono text-[11px]">{conversation.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={conversation.status} />
            <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {conversation.user}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <Icon className="size-4 text-muted-foreground" />
                  <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              )
            })}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="text-foreground">{conversation.user}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" /> Last updated
              </dt>
              <dd className="text-foreground">{relativeTime(conversation.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={() => (onExport(conversation.id, `${conversation.id} exported`), onClose())}
          >
            <Download className="size-4" /> Export
          </Button>
          <div className="flex gap-2">
            {isFlagged ? (
              <Button
                variant="outline"
                onClick={() => (onPatch(conversation.id, { status: "active" }, `${conversation.id} unflagged`), onClose())}
              >
                <FlagOff className="size-4" /> Clear flag
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  (onPatch(conversation.id, { status: "flagged" }, `${conversation.id} flagged for review`), onClose())
                }
              >
                <Flag className="size-4" /> Flag
              </Button>
            )}
            {isArchived ? (
              <Button
                onClick={() => (onPatch(conversation.id, { status: "active" }, `${conversation.id} restored`), onClose())}
              >
                <ArchiveRestore className="size-4" /> Restore
              </Button>
            ) : (
              <Button
                onClick={() => (onPatch(conversation.id, { status: "archived" }, `${conversation.id} archived`), onClose())}
              >
                <Archive className="size-4" /> Archive
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

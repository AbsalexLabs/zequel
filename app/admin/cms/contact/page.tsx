"use client"

import { useMemo, useState } from "react"
import { Mail, MailOpen, Reply, Archive, Trash2, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { formatNumber, relativeTime, formatDateTime } from "@/lib/admin-dashboard/format"
import { contactMessages as initialMessages } from "@/lib/admin-dashboard/cms-mock-data"
import type { ContactMessage, MessageStatus } from "@/lib/admin-dashboard/cms-types"

const STATUS_META: Record<MessageStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/10 text-primary" },
  read: { label: "Read", className: "bg-secondary text-secondary-foreground" },
  replied: { label: "Replied", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
}

function StatusBadge({ status }: { status: MessageStatus }) {
  const meta = STATUS_META[status]
  return <Badge variant="secondary" className={`text-[11px] font-medium ${meta.className}`}>{meta.label}</Badge>
}

export default function CmsContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [active, setActive] = useState<ContactMessage | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return messages
      .filter((m) => {
        const matchesSearch =
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q)
        const matchesStatus = status === "all" || m.status === status
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [messages, search, status])

  const unread = messages.filter((m) => m.status === "new").length
  const replied = messages.filter((m) => m.status === "replied").length

  function setStatusFor(id: string, next: MessageStatus, note?: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: next } : m)))
    if (note) toast.success(note)
  }

  function openMessage(m: ContactMessage) {
    setActive(m)
    setOpen(true)
    if (m.status === "new") setStatusFor(m.id, "read")
  }

  function remove(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id))
    toast.success("Message deleted")
  }

  return (
    <>
      <PageHeader title="Contact Messages" description="Messages submitted through the public contact form." />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(messages.length)} />
        <StatCard label="Unread" value={formatNumber(unread)} />
        <StatCard label="Replied" value={formatNumber(replied)} />
        <StatCard label="Archived" value={formatNumber(messages.filter((m) => m.status === "archived").length)} />
      </section>

      <div className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email, or subject..."
          filters={[
            {
              id: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { label: "All status", value: "all" },
                { label: "New", value: "new" },
                { label: "Read", value: "read" },
                { label: "Replied", value: "replied" },
                { label: "Archived", value: "archived" },
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<ContactMessage>
            rows={filtered}
            rowKey={(m) => m.id}
            empty="No messages found."
            onRowClick={openMessage}
            columns={[
              {
                key: "from",
                header: "From",
                cell: (m) => (
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      {m.status === "new" ? (
                        <Mail className="size-4 text-primary" />
                      ) : (
                        <MailOpen className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className={`truncate text-sm ${m.status === "new" ? "font-semibold" : "font-medium"} text-foreground`}>
                        {m.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "subject",
                header: "Subject",
                cell: (m) => <span className="line-clamp-1 text-sm text-muted-foreground">{m.subject}</span>,
              },
              { key: "status", header: "Status", cell: (m) => <StatusBadge status={m.status} /> },
              {
                key: "received",
                header: "Received",
                cell: (m) => <span className="text-sm text-muted-foreground">{relativeTime(m.createdAt)}</span>,
              },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (m) => (
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Message actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openMessage(m)}>
                          <MailOpen className="size-4" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setStatusFor(m.id, "replied", "Marked as replied")}>
                          <Reply className="size-4" /> Mark replied
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setStatusFor(m.id, "archived", "Message archived")}>
                          <Archive className="size-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(m.id)}>
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ),
              },
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {messages.length} messages
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.subject}</DialogTitle>
                <DialogDescription>
                  From {active.name} · {formatDateTime(active.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status={active.status} />
                  <a href={`mailto:${active.email}`} className="text-primary hover:underline">
                    {active.email}
                  </a>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                  {active.message}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFor(active.id, "archived", "Message archived")
                    setOpen(false)
                  }}
                >
                  <Archive className="size-4" /> Archive
                </Button>
                <Button asChild>
                  <a
                    href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(active.subject)}`}
                    onClick={() => setStatusFor(active.id, "replied")}
                  >
                    <Reply className="size-4" /> Reply
                  </a>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

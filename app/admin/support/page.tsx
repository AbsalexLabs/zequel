"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill, PriorityPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import {
  TicketRowActions,
  NewTicketDialog,
  type TicketPatch,
} from "@/components/admin/support-manager"
import { supportTickets as initialTickets } from "@/lib/admin-dashboard/mock-data"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { SupportTicket } from "@/lib/admin-dashboard/types"

const CATEGORY_LABEL: Record<string, string> = {
  bug: "Bug",
  billing: "Billing",
  feature: "Feature",
  account: "Account",
  other: "Other",
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [priority, setPriority] = useState("all")
  const [inviteOpen, setInviteOpen] = useState(false)

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        t.subject.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
      const matchesStatus = status === "all" || t.status === status
      const matchesPriority = priority === "all" || t.priority === priority
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, search, status, priority])

  const open = tickets.filter((t) => t.status === "open").length
  const urgent = tickets.filter((t) => t.priority === "urgent").length
  const pending = tickets.filter((t) => t.status === "pending").length
  const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length

  function patchTicket(id: string, patch: TicketPatch, message: string) {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)),
    )
    toast.success(message)
  }

  function replyTicket(id: string, message: string) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "open" ? "pending" : t.status, updatedAt: new Date().toISOString() }
          : t,
      ),
    )
    toast.success(message)
  }

  function createTicket(ticket: SupportTicket, message: string) {
    setTickets((prev) => [ticket, ...prev])
    toast.success(message)
  }

  return (
    <>
      <PageHeader title="Support" description="User tickets, bug reports, and requests across the platform.">
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <Plus className="size-4" /> New ticket
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open" value={formatNumber(open)} />
        <StatCard label="Urgent" value={formatNumber(urgent)} />
        <StatCard label="Pending" value={formatNumber(pending)} />
        <StatCard label="Resolved" value={formatNumber(resolved)} />
      </section>

      <div className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tickets..."
          filters={[
            {
              id: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { label: "All status", value: "all" },
                { label: "Open", value: "open" },
                { label: "Pending", value: "pending" },
                { label: "Resolved", value: "resolved" },
                { label: "Closed", value: "closed" },
              ],
            },
            {
              id: "priority",
              label: "Priority",
              value: priority,
              onChange: setPriority,
              options: [
                { label: "All priority", value: "all" },
                { label: "Low", value: "low" },
                { label: "Normal", value: "normal" },
                { label: "High", value: "high" },
                { label: "Urgent", value: "urgent" },
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<SupportTicket>
            rows={filtered}
            rowKey={(t) => t.id}
            columns={[
              {
                key: "subject",
                header: "Subject",
                cell: (t) => (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{t.id}</p>
                  </div>
                ),
              },
              {
                key: "user",
                header: "Requester",
                cell: (t) => (
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{t.user}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.email}</p>
                  </div>
                ),
              },
              {
                key: "category",
                header: "Category",
                cell: (t) => <span className="text-sm text-muted-foreground">{CATEGORY_LABEL[t.category]}</span>,
              },
              { key: "priority", header: "Priority", cell: (t) => <PriorityPill priority={t.priority} /> },
              { key: "status", header: "Status", cell: (t) => <StatusPill status={t.status} /> },
              {
                key: "updated",
                header: "Updated",
                cell: (t) => <span className="text-sm text-muted-foreground">{relativeTime(t.updatedAt)}</span>,
              },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (t) => (
                  <div className="flex justify-end">
                    <TicketRowActions ticket={t} onPatch={patchTicket} onReply={replyTicket} />
                  </div>
                ),
              },
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {tickets.length} tickets
        </p>
      </div>

      <NewTicketDialog open={inviteOpen} onOpenChange={setInviteOpen} onCreate={createTicket} />
    </>
  )
}

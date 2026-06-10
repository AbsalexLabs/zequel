"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill, PriorityPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { toast } from "sonner"
import {
  TicketRowActions,
  type TicketPatch,
} from "@/components/admin/support-manager"
import { useSupportTickets, updateBugReportStatus } from "@/lib/admin-dashboard/api"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { SupportTicket } from "@/lib/admin-dashboard/types"

const CATEGORY_LABEL: Record<string, string> = {
  bug: "Bug",
  billing: "Billing",
  feature: "Feature",
  account: "Account",
  other: "Other",
}

// Map the UI ticket status to the bug_reports status enum the API expects.
const TICKET_TO_BUG_STATUS: Record<string, string> = {
  open: "open",
  pending: "in_progress",
  resolved: "resolved",
  closed: "closed",
}

export default function SupportPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [priority, setPriority] = useState("all")

  const { tickets, isLoading, error, mutate } = useSupportTickets({ search })

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = status === "all" || t.status === status
      const matchesPriority = priority === "all" || t.priority === priority
      return matchesStatus && matchesPriority
    })
  }, [tickets, status, priority])

  const open = tickets.filter((t) => t.status === "open").length
  const urgent = tickets.filter((t) => t.priority === "urgent").length
  const pending = tickets.filter((t) => t.status === "pending").length
  const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length

  async function patchTicket(id: string, patch: TicketPatch, message: string) {
    // Only status changes are persisted (bug_reports has no priority field).
    if (!patch.status) {
      toast.message("Priority is presentation-only for bug reports")
      return
    }
    try {
      await updateBugReportStatus(id, TICKET_TO_BUG_STATUS[patch.status] || "open")
      await mutate()
      toast.success(message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  async function replyTicket(id: string, message: string) {
    // No reply transport is wired yet; advance the report to in_progress.
    try {
      await updateBugReportStatus(id, "in_progress")
      await mutate()
      toast.success(message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <>
      <PageHeader title="Support" description="User bug reports and requests across the platform." />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load tickets: {error.message}
        </p>
      )}

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
          {isLoading ? "Loading tickets…" : `Showing ${filtered.length} of ${tickets.length} tickets`}
        </p>
      </div>
    </>
  )
}

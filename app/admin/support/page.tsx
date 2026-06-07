"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill, PriorityPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { supportTickets } from "@/lib/admin-dashboard/mock-data"
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
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [priority, setPriority] = useState("all")

  const filtered = useMemo(() => {
    return supportTickets.filter((t) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q || t.subject.toLowerCase().includes(q) || t.user.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
      const matchesStatus = status === "all" || t.status === status
      const matchesPriority = priority === "all" || t.priority === priority
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [search, status, priority])

  const open = supportTickets.filter((t) => t.status === "open").length
  const urgent = supportTickets.filter((t) => t.priority === "urgent").length
  const pending = supportTickets.filter((t) => t.status === "pending").length
  const resolved = supportTickets.filter((t) => t.status === "resolved" || t.status === "closed").length

  return (
    <>
      <PageHeader title="Support" description="User tickets, bug reports, and requests across the platform.">
        <Button size="sm">New ticket</Button>
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
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {supportTickets.length} tickets
        </p>
      </div>
    </>
  )
}

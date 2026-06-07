"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { StatusPill } from "@/components/admin/status-pill"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { ConversationRowActions, type ConversationPatch } from "@/components/admin/conversation-manager"
import { conversations as seedConversations } from "@/lib/admin-dashboard/mock-data"
import { formatCompact, formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import type { Conversation } from "@/lib/admin-dashboard/types"

export default function ConversationsPage() {
  const [rows, setRows] = useState<Conversation[]>(seedConversations)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || c.title.toLowerCase().includes(q) || c.user.toLowerCase().includes(q)
      const matchesStatus = status === "all" || c.status === status
      return matchesSearch && matchesStatus
    })
  }, [rows, search, status])

  const totalMessages = rows.reduce((a, c) => a + c.messages, 0)
  const flagged = rows.filter((c) => c.status === "flagged").length
  const active = rows.filter((c) => c.status === "active").length

  function patchConversation(id: string, patch: ConversationPatch, message: string) {
    setRows((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c)),
    )
    toast.success(message)
  }

  function exportConversation(_id: string, message: string) {
    toast.success(message)
  }

  return (
    <>
      <PageHeader
        title="Conversations"
        description="Research sessions, message volume, and document-grounded threads."
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Sessions" value={formatNumber(rows.length)} hint="in view" />
        <StatCard label="Active" value={formatNumber(active)} />
        <StatCard label="Messages" value={formatCompact(totalMessages)} />
        <StatCard label="Flagged" value={formatNumber(flagged)} />
      </section>

      <div className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search conversations..."
          filters={[
            {
              id: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { label: "All status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Archived", value: "archived" },
                { label: "Flagged", value: "flagged" },
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<Conversation>
            rows={filtered}
            rowKey={(c) => c.id}
            columns={[
              {
                key: "title",
                header: "Conversation",
                cell: (c) => (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{c.id}</p>
                  </div>
                ),
              },
              {
                key: "user",
                header: "Owner",
                cell: (c) => <span className="text-sm text-foreground">{c.user}</span>,
              },
              {
                key: "messages",
                header: "Messages",
                className: "text-right",
                cell: (c) => <span className="tabular-nums text-foreground">{c.messages}</span>,
              },
              {
                key: "documents",
                header: "Docs",
                className: "text-right",
                cell: (c) => <span className="tabular-nums text-muted-foreground">{c.documents}</span>,
              },
              {
                key: "tokens",
                header: "Tokens",
                className: "text-right",
                cell: (c) => <span className="tabular-nums text-muted-foreground">{formatNumber(c.tokens)}</span>,
              },
              { key: "status", header: "Status", cell: (c) => <StatusPill status={c.status} /> },
              {
                key: "updated",
                header: "Updated",
                cell: (c) => <span className="text-sm text-muted-foreground">{relativeTime(c.updatedAt)}</span>,
              },
              {
                key: "actions",
                header: "",
                className: "w-10 text-right",
                cell: (c) => (
                  <ConversationRowActions
                    conversation={c}
                    onPatch={patchConversation}
                    onExport={exportConversation}
                  />
                ),
              },
            ]}
          />
        </DataTableCard>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {rows.length} conversations
        </p>
      </div>
    </>
  )
}

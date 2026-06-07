"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { RoleGuard } from "@/components/admin/role-guard"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { auditLog } from "@/lib/admin-dashboard/mock-data"
import { formatDateTime } from "@/lib/admin-dashboard/format"
import type { AuditLogEntry } from "@/lib/admin-dashboard/types"

export default function AuditPage() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")

  const filtered = useMemo(() => {
    return auditLog.filter((e) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q)
      const matchesRole = role === "all" || e.actorRole === role
      return matchesSearch && matchesRole
    })
  }, [search, role])

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Immutable record of privileged administrative actions. Superadmin access only."
      />

      <RoleGuard required="superadmin">
        <div className="space-y-4">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search actor, action, or target..."
            filters={[
              {
                id: "role",
                label: "Actor role",
                value: role,
                onChange: setRole,
                options: [
                  { label: "All roles", value: "all" },
                  { label: "Admin", value: "admin" },
                  { label: "Superadmin", value: "superadmin" },
                ],
              },
            ]}
          />

          <DataTableCard>
            <DataTable<AuditLogEntry>
              rows={filtered}
              rowKey={(e) => e.id}
              columns={[
                {
                  key: "actor",
                  header: "Actor",
                  cell: (e) => (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{e.actor}</p>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {e.actorRole}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "action",
                  header: "Action",
                  cell: (e) => <span className="text-sm text-foreground">{e.action}</span>,
                },
                {
                  key: "target",
                  header: "Target",
                  cell: (e) => <span className="font-mono text-xs text-muted-foreground">{e.target}</span>,
                },
                {
                  key: "ip",
                  header: "IP Address",
                  cell: (e) => <span className="font-mono text-xs text-muted-foreground">{e.ip}</span>,
                },
                {
                  key: "time",
                  header: "Timestamp",
                  cell: (e) => <span className="text-sm text-muted-foreground">{formatDateTime(e.createdAt)}</span>,
                },
              ]}
            />
          </DataTableCard>

          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {auditLog.length} entries
          </p>
        </div>
      </RoleGuard>
    </>
  )
}

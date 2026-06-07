"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ScrollText, Clock, Globe, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { RoleGuard } from "@/components/admin/role-guard"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { auditLog } from "@/lib/admin-dashboard/mock-data"
import { formatDateTime } from "@/lib/admin-dashboard/format"
import type { AuditLogEntry } from "@/lib/admin-dashboard/types"

function toCsv(rows: AuditLogEntry[]): string {
  const header = ["id", "actor", "actorRole", "action", "target", "ip", "createdAt"]
  const body = rows.map((e) =>
    [e.id, e.actor, e.actorRole, e.action, e.target, e.ip, e.createdAt]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  )
  return [header.join(","), ...body].join("\n")
}

export default function AuditPage() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [selected, setSelected] = useState<AuditLogEntry | null>(null)

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

  function exportCsv() {
    const csv = toCsv(filtered)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} entries`)
  }

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Immutable record of privileged administrative actions. Superadmin access only."
      >
        <Button variant="outline" size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
      </PageHeader>

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
                {
                  key: "actions",
                  header: "",
                  className: "w-16 text-right",
                  cell: (e) => (
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelected(e)}>
                      View
                    </Button>
                  ),
                },
              ]}
            />
          </DataTableCard>

          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {auditLog.length} entries
          </p>
        </div>
      </RoleGuard>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="size-4" />
              Audit entry
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px]">{selected?.id}</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 py-1">
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Action</p>
                <p className="mt-1 text-sm font-medium text-foreground">{selected.action}</p>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <ShieldCheck className="size-3.5" /> Actor
                  </dt>
                  <dd className="text-foreground">
                    {selected.actor}{" "}
                    <span className="font-mono text-[11px] uppercase text-muted-foreground">
                      ({selected.actorRole})
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Target</dt>
                  <dd className="font-mono text-xs text-foreground">{selected.target}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Globe className="size-3.5" /> IP address
                  </dt>
                  <dd className="font-mono text-xs text-foreground">{selected.ip}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-3.5" /> Timestamp
                  </dt>
                  <dd className="text-foreground">{formatDateTime(selected.createdAt)}</dd>
                </div>
              </dl>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ScrollText, Clock, Globe, ShieldCheck, Crosshair, Copy, Check } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { RoleGuard } from "@/components/admin/role-guard"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { Button } from "@zequel/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zequel/ui/components/dialog"
import { useAuditLog } from "@/lib/admin-dashboard/api"
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

  const { entries, isLoading, error } = useAuditLog({ limit: 200 })

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q)
      const matchesRole = role === "all" || e.actorRole === role
      return matchesSearch && matchesRole
    })
  }, [entries, search, role])

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
          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to load audit log: {error.message}
            </p>
          )}
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
            {isLoading ? "Loading audit log…" : `Showing ${filtered.length} of ${entries.length} entries`}
          </p>
        </div>
      </RoleGuard>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="size-4 text-muted-foreground" />
              Audit entry
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="truncate">{selected?.id}</span>
              {selected && <CopyButton value={selected.id} label="Copy entry ID" />}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 px-5 py-5">
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Action</p>
                <p className="mt-1 text-sm font-medium capitalize text-foreground">{selected.action}</p>
              </div>

              <dl className="divide-y divide-border rounded-lg border border-border">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <dt className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                    <ShieldCheck className="size-3.5" /> Actor
                  </dt>
                  <dd className="min-w-0 truncate text-right text-sm text-foreground">
                    {selected.actor}{" "}
                    <span className="font-mono text-[11px] uppercase text-muted-foreground">
                      ({selected.actorRole})
                    </span>
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <dt className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                    <Crosshair className="size-3.5" /> Target
                  </dt>
                  <dd className="flex min-w-0 items-center justify-end gap-1.5">
                    <span className="truncate font-mono text-xs text-foreground">{selected.target}</span>
                    <CopyButton value={selected.target} label="Copy target" />
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <dt className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                    <Globe className="size-3.5" /> IP address
                  </dt>
                  <dd className="flex min-w-0 items-center justify-end gap-1.5">
                    <span className="truncate font-mono text-xs text-foreground">{selected.ip}</span>
                    {selected.ip && selected.ip !== "—" && (
                      <CopyButton value={selected.ip} label="Copy IP address" />
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <dt className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-3.5" /> Timestamp
                  </dt>
                  <dd className="text-right text-sm text-foreground">{formatDateTime(selected.createdAt)}</dd>
                </div>
              </dl>

              {selected.details && Object.keys(selected.details).length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Details</p>
                  <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-secondary/40 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                    {JSON.stringify(selected.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-border px-5 py-4">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Small inline copy-to-clipboard button used for the target and IP fields in
 * the audit entry dialog.
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); fail silently.
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      aria-label={label}
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
    </button>
  )
}

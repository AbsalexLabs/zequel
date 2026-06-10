"use client"

import { useMemo, useState } from "react"
import { Trash2, MoreHorizontal, Bug, ExternalLink } from "lucide-react"
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatNumber, relativeTime, formatDateTime } from "@/lib/admin-dashboard/format"
import { useCmsList, updateCmsItem, deleteCmsItem } from "@/lib/admin-dashboard/cms-api"
import type { BugReport, BugSeverity, BugStatus } from "@/lib/admin-dashboard/cms-types"

const RESOURCE = "bug-reports"

const SEVERITY_META: Record<BugSeverity, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-secondary text-secondary-foreground" },
  medium: { label: "Medium", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  high: { label: "High", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  critical: { label: "Critical", className: "bg-destructive/10 text-destructive" },
}
const STATUS_META: Record<BugStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/10 text-primary" },
  triaged: { label: "Triaged", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  in_progress: { label: "In progress", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  resolved: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  wont_fix: { label: "Won't fix", className: "bg-muted text-muted-foreground" },
}
const SEVERITY_ORDER: BugSeverity[] = ["critical", "high", "medium", "low"]
const STATUS_ORDER: BugStatus[] = ["new", "triaged", "in_progress", "resolved", "wont_fix"]

export default function CmsBugReportsPage() {
  const { items: bugs, isLoading, error, mutate } = useCmsList<BugReport>(RESOURCE)
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("all")
  const [status, setStatus] = useState("all")
  const [active, setActive] = useState<BugReport | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const sevRank: Record<BugSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return bugs
      .filter((b) => {
        const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.reporter.toLowerCase().includes(q)
        const matchesSeverity = severity === "all" || b.severity === severity
        const matchesStatus = status === "all" || b.status === status
        return matchesSearch && matchesSeverity && matchesStatus
      })
      .sort((a, b) => sevRank[a.severity] - sevRank[b.severity])
  }, [bugs, search, severity, status])

  const open_ = bugs.filter((b) => b.status === "new").length
  const critical = bugs.filter((b) => b.severity === "critical").length
  const resolved = bugs.filter((b) => b.status === "resolved").length

  async function setStatusFor(id: string, next: BugStatus) {
    setActive((prev) => (prev && prev.id === id ? { ...prev, status: next } : prev))
    try {
      await updateCmsItem<BugReport>(RESOURCE, id, { status: next })
      await mutate()
      toast.success(`Status set to "${STATUS_META[next].label}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  async function remove(id: string) {
    try {
      await deleteCmsItem(RESOURCE, id)
      await mutate()
      toast.success("Bug report deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  function openBug(b: BugReport) {
    setActive(b)
    setOpen(true)
  }

  return (
    <>
      <PageHeader title="Bug Reports" description="Issues reported from the public site, triaged by severity and status." />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(bugs.length)} />
        <StatCard label="New" value={formatNumber(open_)} />
        <StatCard label="Critical" value={formatNumber(critical)} />
        <StatCard label="Resolved" value={formatNumber(resolved)} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load bug reports: {error.message}
          </p>
        )}
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search bug reports..."
          filters={[
            {
              id: "severity",
              label: "Severity",
              value: severity,
              onChange: setSeverity,
              options: [
                { label: "All severity", value: "all" },
                ...SEVERITY_ORDER.map((s) => ({ label: SEVERITY_META[s].label, value: s })),
              ],
            },
            {
              id: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { label: "All status", value: "all" },
                ...STATUS_ORDER.map((s) => ({ label: STATUS_META[s].label, value: s })),
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<BugReport>
            rows={filtered}
            rowKey={(b) => b.id}
            empty="No bug reports found."
            onRowClick={openBug}
            columns={[
              {
                key: "title",
                header: "Report",
                cell: (b) => (
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <Bug className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{b.title}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{b.url}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "severity",
                header: "Severity",
                cell: (b) => (
                  <Badge variant="secondary" className={`text-[11px] font-medium ${SEVERITY_META[b.severity].className}`}>
                    {SEVERITY_META[b.severity].label}
                  </Badge>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (b) => (
                  <Badge variant="secondary" className={`text-[11px] font-medium ${STATUS_META[b.status].className}`}>
                    {STATUS_META[b.status].label}
                  </Badge>
                ),
              },
              {
                key: "reporter",
                header: "Reporter",
                cell: (b) => <span className="text-sm text-muted-foreground">{b.reporter}</span>,
              },
              {
                key: "created",
                header: "Reported",
                cell: (b) => <span className="text-sm text-muted-foreground">{relativeTime(b.createdAt)}</span>,
              },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (b) => (
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Report actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Set status</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={b.status} onValueChange={(v) => setStatusFor(b.id, v as BugStatus)}>
                          {STATUS_ORDER.map((s) => (
                            <DropdownMenuRadioItem key={s} value={s}>
                              {STATUS_META[s].label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(b.id)}>
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
          {isLoading ? "Loading reports…" : `Showing ${filtered.length} of ${bugs.length} reports`}
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription>
                  Reported by {active.reporter} · {formatDateTime(active.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={`text-[11px] font-medium ${SEVERITY_META[active.severity].className}`}>
                    {SEVERITY_META[active.severity].label}
                  </Badge>
                  <Badge variant="secondary" className={`text-[11px] font-medium ${STATUS_META[active.status].className}`}>
                    {STATUS_META[active.status].label}
                  </Badge>
                  <a
                    href={active.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                  >
                    {active.url} <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                  {active.description}
                </div>
                <a href={`mailto:${active.email}`} className="text-sm text-primary hover:underline">
                  {active.email}
                </a>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Change status</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup value={active.status} onValueChange={(v) => setStatusFor(active.id, v as BugStatus)}>
                      {STATUS_ORDER.map((s) => (
                        <DropdownMenuRadioItem key={s} value={s}>
                          {STATUS_META[s].label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

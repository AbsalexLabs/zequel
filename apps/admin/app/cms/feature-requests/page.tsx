"use client"

import { useMemo, useState } from "react"
import { ChevronUp, Trash2, MoreHorizontal, Lightbulb } from "lucide-react"
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
import type { FeatureRequest, RequestStatus } from "@/lib/admin-dashboard/cms-types"

const RESOURCE = "feature-requests"

const STATUS_META: Record<RequestStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-secondary text-secondary-foreground" },
  planned: { label: "Planned", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  in_progress: { label: "In progress", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  shipped: { label: "Shipped", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  declined: { label: "Declined", className: "bg-muted text-muted-foreground" },
}
const STATUS_ORDER: RequestStatus[] = ["open", "planned", "in_progress", "shipped", "declined"]

function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status]
  return <Badge variant="secondary" className={`text-[11px] font-medium ${meta.className}`}>{meta.label}</Badge>
}

export default function CmsFeatureRequestsPage() {
  const { items: requests, isLoading, error, mutate } = useCmsList<FeatureRequest>(RESOURCE)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [active, setActive] = useState<FeatureRequest | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requests
      .filter((r) => {
        const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.requester.toLowerCase().includes(q)
        const matchesStatus = status === "all" || r.status === status
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => b.votes - a.votes)
  }, [requests, search, status])

  const open_ = requests.filter((r) => r.status === "open").length
  const planned = requests.filter((r) => r.status === "planned" || r.status === "in_progress").length
  const shipped = requests.filter((r) => r.status === "shipped").length

  async function setStatusFor(id: string, next: RequestStatus) {
    setActive((prev) => (prev && prev.id === id ? { ...prev, status: next } : prev))
    try {
      await updateCmsItem<FeatureRequest>(RESOURCE, id, { status: next })
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
      toast.success("Request deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  function openRequest(r: FeatureRequest) {
    setActive(r)
    setOpen(true)
  }

  return (
    <>
      <PageHeader title="Feature Requests" description="Ideas submitted by users, ranked by community votes." />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(requests.length)} />
        <StatCard label="Open" value={formatNumber(open_)} />
        <StatCard label="In pipeline" value={formatNumber(planned)} />
        <StatCard label="Shipped" value={formatNumber(shipped)} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load requests: {error.message}
          </p>
        )}
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search requests..."
          filters={[
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
          <DataTable<FeatureRequest>
            rows={filtered}
            rowKey={(r) => r.id}
            empty="No requests found."
            onRowClick={openRequest}
            columns={[
              {
                key: "votes",
                header: "Votes",
                className: "w-20",
                cell: (r) => (
                  <div className="flex w-12 flex-col items-center rounded-md border border-border bg-secondary/50 py-1">
                    <ChevronUp className="size-4 text-primary" />
                    <span className="tabular-nums text-sm font-semibold text-foreground">{formatNumber(r.votes)}</span>
                  </div>
                ),
              },
              {
                key: "title",
                header: "Request",
                cell: (r) => (
                  <div className="flex items-center gap-3">
                    <span className="hidden size-8 shrink-0 items-center justify-center rounded-md bg-secondary sm:flex">
                      <Lightbulb className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">by {r.requester}</p>
                    </div>
                  </div>
                ),
              },
              { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
              {
                key: "created",
                header: "Submitted",
                cell: (r) => <span className="text-sm text-muted-foreground">{relativeTime(r.createdAt)}</span>,
              },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (r) => (
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Request actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Set status</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={r.status} onValueChange={(v) => setStatusFor(r.id, v as RequestStatus)}>
                          {STATUS_ORDER.map((s) => (
                            <DropdownMenuRadioItem key={s} value={s}>
                              {STATUS_META[s].label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(r.id)}>
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
          {isLoading ? "Loading requests…" : `Showing ${filtered.length} of ${requests.length} requests`}
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription>
                  Submitted by {active.requester} · {formatDateTime(active.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-1">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={active.status} />
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <ChevronUp className="size-4 text-primary" />
                    {formatNumber(active.votes)} votes
                  </span>
                  <a href={`mailto:${active.email}`} className="text-sm text-primary hover:underline">
                    {active.email}
                  </a>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                  {active.description}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Change status</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={active.status}
                      onValueChange={(v) => setStatusFor(active.id, v as RequestStatus)}
                    >
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

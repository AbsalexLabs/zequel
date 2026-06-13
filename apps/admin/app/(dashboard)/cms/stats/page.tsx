"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, MoreHorizontal, Send, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { Button } from "@zequel/ui/components/button"
import { Input } from "@zequel/ui/components/input"
import { Label } from "@zequel/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zequel/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zequel/ui/components/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zequel/ui/components/select"
import { formatNumber } from "@/lib/admin-dashboard/format"
import { useCmsList, createCmsItem, updateCmsItem, deleteCmsItem } from "@/lib/admin-dashboard/cms-api"
import type { StatItem, PublishStatus } from "@zequel/types"

const RESOURCE = "stats"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const GROUPS = ["home", "about"]

const EMPTY: StatItem = {
  id: "",
  value: "",
  label: "",
  group: "home",
  order: 0,
  status: "draft",
  updatedAt: "",
}

export default function StatsPage() {
  const { items: stats, isLoading, error, mutate } = useCmsList<StatItem>(RESOURCE)
  const [search, setSearch] = useState("")
  const [group, setGroup] = useState("all")
  const [editing, setEditing] = useState<StatItem | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stats
      .filter((s) => {
        const matchesSearch = !q || s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)
        const matchesGroup = group === "all" || s.group === group
        return matchesSearch && matchesGroup
      })
      .sort((a, b) => a.order - b.order)
  }, [stats, search, group])

  const published = stats.filter((s) => s.status === "published").length

  function openNew() {
    setEditing({ ...EMPTY, order: stats.length + 1 })
    setOpen(true)
  }
  function openEdit(s: StatItem) {
    setEditing({ ...s })
    setOpen(true)
  }

  async function save(s: StatItem) {
    const { id, updatedAt, ...payload } = s
    try {
      if (id) {
        await updateCmsItem<StatItem>(RESOURCE, id, payload)
        toast.success(`"${s.label}" saved`)
      } else {
        await createCmsItem<StatItem>(RESOURCE, payload)
        toast.success(`"${s.label}" created`)
      }
      await mutate()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  async function publish(id: string) {
    try {
      await updateCmsItem<StatItem>(RESOURCE, id, { status: "published" })
      await mutate()
      toast.success("Stat published")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed")
    }
  }

  async function remove(id: string, label: string) {
    try {
      await deleteCmsItem(RESOURCE, id)
      await mutate()
      toast.success(`"${label}" deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  return (
    <>
      <PageHeader
        title="Stats"
        description="The number band on the home page and the values band on the about page."
      >
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New stat
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(stats.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Home" value={formatNumber(stats.filter((s) => s.group === "home").length)} />
        <StatCard label="About" value={formatNumber(stats.filter((s) => s.group === "about").length)} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load stats: {error.message}
          </p>
        )}
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search stats..."
          filters={[
            {
              id: "group",
              label: "Group",
              value: group,
              onChange: setGroup,
              options: [{ label: "All groups", value: "all" }, ...GROUPS.map((g) => ({ label: g, value: g }))],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<StatItem>
            rows={filtered}
            rowKey={(s) => s.id}
            empty="No stats found."
            columns={[
              {
                key: "order",
                header: "#",
                className: "w-12",
                cell: (s) => <span className="font-mono text-xs text-muted-foreground">{s.order}</span>,
              },
              {
                key: "value",
                header: "Stat",
                cell: (s) => (
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <BarChart3 className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{s.value}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "group",
                header: "Group",
                cell: (s) => <span className="text-sm capitalize text-muted-foreground">{s.group}</span>,
              },
              { key: "status", header: "Status", cell: (s) => <CmsStatusPill status={s.status} /> },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (s) => (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Stat actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(s)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        {s.status !== "published" && (
                          <DropdownMenuItem onSelect={() => publish(s.id)}>
                            <Send className="size-4" /> Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(s.id, s.label)}>
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
          {isLoading ? "Loading stats…" : `Showing ${filtered.length} of ${stats.length} stats`}
        </p>
      </div>

      {editing && (
        <StatEditDialog key={editing.id || "new"} open={open} onOpenChange={setOpen} stat={editing} onSave={save} />
      )}
    </>
  )
}

function StatEditDialog({
  open,
  onOpenChange,
  stat,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  stat: StatItem
  onSave: (s: StatItem) => void
}) {
  const [draft, setDraft] = useState<StatItem>(stat)

  function set<K extends keyof StatItem>(key: K, value: StatItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.value.trim().length > 0 && draft.label.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit stat" : "New stat"}</DialogTitle>
          <DialogDescription>A single number shown in a stats band.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="stat-value">Value</Label>
              <Input id="stat-value" value={draft.value} onChange={(e) => set("value", e.target.value)} placeholder="99.98%" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stat-label">Label</Label>
              <Input id="stat-label" value={draft.label} onChange={(e) => set("label", e.target.value)} placeholder="Uptime" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stat-group">Group</Label>
              <Select value={draft.group} onValueChange={(v) => set("group", v)}>
                <SelectTrigger id="stat-group" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUPS.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stat-order">Order</Label>
              <Input
                id="stat-order"
                inputMode="numeric"
                value={String(draft.order)}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stat-status">Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
                <SelectTrigger id="stat-status" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)} disabled={!valid}>
            {draft.id ? "Save changes" : "Create stat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

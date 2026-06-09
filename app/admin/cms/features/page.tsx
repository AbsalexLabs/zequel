"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, MoreHorizontal, Send, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatNumber } from "@/lib/admin-dashboard/format"
import { featureItems as initialFeatures } from "@/lib/admin-dashboard/cms-mock-data"
import type { FeatureItem, PublishStatus } from "@/lib/admin-dashboard/cms-types"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const EMPTY: FeatureItem = {
  id: "",
  title: "",
  description: "",
  icon: "Sparkles",
  group: "Research",
  order: 0,
  status: "draft",
  updatedAt: "",
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureItem[]>(initialFeatures)
  const [search, setSearch] = useState("")
  const [group, setGroup] = useState("all")
  const [editing, setEditing] = useState<FeatureItem | null>(null)
  const [open, setOpen] = useState(false)

  const groups = useMemo(() => Array.from(new Set(features.map((f) => f.group))), [features])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return features
      .filter((f) => {
        const matchesSearch = !q || f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
        const matchesGroup = group === "all" || f.group === group
        return matchesSearch && matchesGroup
      })
      .sort((a, b) => a.order - b.order)
  }, [features, search, group])

  const published = features.filter((f) => f.status === "published").length

  function openNew() {
    setEditing({ ...EMPTY, order: features.length + 1 })
    setOpen(true)
  }
  function openEdit(f: FeatureItem) {
    setEditing({ ...f })
    setOpen(true)
  }

  function save(f: FeatureItem) {
    const now = new Date().toISOString()
    if (f.id) {
      setFeatures((prev) => prev.map((x) => (x.id === f.id ? { ...f, updatedAt: now } : x)))
      toast.success(`"${f.title}" saved`)
    } else {
      setFeatures((prev) => [...prev, { ...f, id: `feat_${Math.random().toString(36).slice(2, 7)}`, updatedAt: now }])
      toast.success(`"${f.title}" created`)
    }
    setOpen(false)
  }

  function publish(id: string) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "published", updatedAt: new Date().toISOString() } : f)),
    )
    toast.success("Feature published")
  }

  function remove(id: string, title: string) {
    setFeatures((prev) => prev.filter((f) => f.id !== id))
    toast.success(`"${title}" deleted`)
  }

  return (
    <>
      <PageHeader title="Features" description="The feature cards highlighted across the marketing site.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New feature
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(features.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Groups" value={formatNumber(groups.length)} />
        <StatCard label="Drafts" value={formatNumber(features.length - published)} />
      </section>

      <div className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search features..."
          filters={[
            {
              id: "group",
              label: "Group",
              value: group,
              onChange: setGroup,
              options: [{ label: "All groups", value: "all" }, ...groups.map((g) => ({ label: g, value: g }))],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<FeatureItem>
            rows={filtered}
            rowKey={(f) => f.id}
            empty="No features found."
            columns={[
              {
                key: "order",
                header: "#",
                className: "w-12",
                cell: (f) => <span className="font-mono text-xs text-muted-foreground">{f.order}</span>,
              },
              {
                key: "title",
                header: "Feature",
                cell: (f) => (
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <Sparkles className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{f.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{f.description}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "group",
                header: "Group",
                cell: (f) => <span className="text-sm text-muted-foreground">{f.group}</span>,
              },
              {
                key: "icon",
                header: "Icon",
                cell: (f) => <span className="font-mono text-xs text-muted-foreground">{f.icon}</span>,
              },
              { key: "status", header: "Status", cell: (f) => <CmsStatusPill status={f.status} /> },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (f) => (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Feature actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(f)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        {f.status !== "published" && (
                          <DropdownMenuItem onSelect={() => publish(f.id)}>
                            <Send className="size-4" /> Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(f.id, f.title)}>
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
          Showing {filtered.length} of {features.length} features
        </p>
      </div>

      {editing && (
        <FeatureEditDialog key={editing.id || "new"} open={open} onOpenChange={setOpen} feature={editing} onSave={save} />
      )}
    </>
  )
}

function FeatureEditDialog({
  open,
  onOpenChange,
  feature,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  feature: FeatureItem
  onSave: (f: FeatureItem) => void
}) {
  const [draft, setDraft] = useState<FeatureItem>(feature)

  function set<K extends keyof FeatureItem>(key: K, value: FeatureItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.title.trim().length > 1 && draft.description.trim().length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit feature" : "New feature"}</DialogTitle>
          <DialogDescription>A single feature card on the website.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="feat-title">Title</Label>
            <Input id="feat-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feat-desc">Description</Label>
            <Textarea
              id="feat-desc"
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[80px] resize-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="feat-group">Group</Label>
              <Input id="feat-group" value={draft.group} onChange={(e) => set("group", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feat-icon">Icon name</Label>
              <Input
                id="feat-icon"
                value={draft.icon}
                onChange={(e) => set("icon", e.target.value)}
                className="font-mono text-sm"
                placeholder="BookOpen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feat-order">Order</Label>
              <Input
                id="feat-order"
                inputMode="numeric"
                value={String(draft.order)}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feat-status">Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
                <SelectTrigger id="feat-status" className="h-9">
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
            {draft.id ? "Save changes" : "Create feature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

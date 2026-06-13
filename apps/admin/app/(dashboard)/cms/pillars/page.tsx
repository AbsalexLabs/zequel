"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, MoreHorizontal, Send, Columns3, X } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { Button } from "@zequel/ui/components/button"
import { Input } from "@zequel/ui/components/input"
import { Label } from "@zequel/ui/components/label"
import { Textarea } from "@zequel/ui/components/textarea"
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
import type { PillarItem, PillarPoint, PublishStatus } from "@zequel/types"

const RESOURCE = "pillars"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const EMPTY: PillarItem = {
  id: "",
  label: "",
  title: "",
  body: "",
  points: [],
  image: "",
  url: "",
  order: 0,
  status: "draft",
  updatedAt: "",
}

export default function PillarsPage() {
  const { items: pillars, isLoading, error, mutate } = useCmsList<PillarItem>(RESOURCE)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<PillarItem | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pillars
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.label.toLowerCase().includes(q))
      .sort((a, b) => a.order - b.order)
  }, [pillars, search])

  const published = pillars.filter((p) => p.status === "published").length

  function openNew() {
    setEditing({ ...EMPTY, order: pillars.length + 1 })
    setOpen(true)
  }
  function openEdit(p: PillarItem) {
    setEditing({ ...p, points: [...(p.points ?? [])] })
    setOpen(true)
  }

  async function save(p: PillarItem) {
    const { id, updatedAt, ...payload } = p
    try {
      if (id) {
        await updateCmsItem<PillarItem>(RESOURCE, id, payload)
        toast.success(`"${p.title}" saved`)
      } else {
        await createCmsItem<PillarItem>(RESOURCE, payload)
        toast.success(`"${p.title}" created`)
      }
      await mutate()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  async function publish(id: string) {
    try {
      await updateCmsItem<PillarItem>(RESOURCE, id, { status: "published" })
      await mutate()
      toast.success("Pillar published")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed")
    }
  }

  async function remove(id: string, title: string) {
    try {
      await deleteCmsItem(RESOURCE, id)
      await mutate()
      toast.success(`"${title}" deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  return (
    <>
      <PageHeader title="Feature Pillars" description="The large alternating feature sections on the features page.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New pillar
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(pillars.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Drafts" value={formatNumber(pillars.length - published)} />
        <StatCard label="Order range" value={pillars.length ? `1–${pillars.length}` : "—"} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load pillars: {error.message}
          </p>
        )}
        <TableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search pillars..." />

        <DataTableCard>
          <DataTable<PillarItem>
            rows={filtered}
            rowKey={(p) => p.id}
            empty="No pillars found."
            columns={[
              {
                key: "order",
                header: "#",
                className: "w-12",
                cell: (p) => <span className="font-mono text-xs text-muted-foreground">{p.order}</span>,
              },
              {
                key: "title",
                header: "Pillar",
                cell: (p) => (
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <Columns3 className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{p.label} · {p.points?.length ?? 0} points</p>
                    </div>
                  </div>
                ),
              },
              { key: "status", header: "Status", cell: (p) => <CmsStatusPill status={p.status} /> },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (p) => (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Pillar actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(p)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        {p.status !== "published" && (
                          <DropdownMenuItem onSelect={() => publish(p.id)}>
                            <Send className="size-4" /> Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(p.id, p.title)}>
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
          {isLoading ? "Loading pillars…" : `Showing ${filtered.length} of ${pillars.length} pillars`}
        </p>
      </div>

      {editing && (
        <PillarEditDialog key={editing.id || "new"} open={open} onOpenChange={setOpen} pillar={editing} onSave={save} />
      )}
    </>
  )
}

function PillarEditDialog({
  open,
  onOpenChange,
  pillar,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  pillar: PillarItem
  onSave: (p: PillarItem) => void
}) {
  const [draft, setDraft] = useState<PillarItem>(pillar)

  function set<K extends keyof PillarItem>(key: K, value: PillarItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function setPoint(index: number, key: keyof PillarPoint, value: string) {
    setDraft((prev) => {
      const points = [...prev.points]
      points[index] = { ...points[index], [key]: value }
      return { ...prev, points }
    })
  }

  function addPoint() {
    setDraft((prev) => ({ ...prev, points: [...prev.points, { icon: "Sparkles", text: "" }] }))
  }

  function removePoint(index: number) {
    setDraft((prev) => ({ ...prev, points: prev.points.filter((_, i) => i !== index) }))
  }

  const valid = draft.title.trim().length > 1 && draft.label.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit pillar" : "New pillar"}</DialogTitle>
          <DialogDescription>A large feature section with a list of bullet points.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pl-label">Label (eyebrow)</Label>
              <Input id="pl-label" value={draft.label} onChange={(e) => set("label", e.target.value)} placeholder="Evidence" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pl-order">Order</Label>
              <Input
                id="pl-order"
                inputMode="numeric"
                value={String(draft.order)}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-title">Title</Label>
            <Input id="pl-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-body">Body</Label>
            <Textarea
              id="pl-body"
              value={draft.body}
              onChange={(e) => set("body", e.target.value)}
              className="min-h-[80px] resize-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pl-image">Image path</Label>
              <Input
                id="pl-image"
                value={draft.image}
                onChange={(e) => set("image", e.target.value)}
                className="font-mono text-sm"
                placeholder="/product-overview.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pl-url">Frame label (URL)</Label>
              <Input
                id="pl-url"
                value={draft.url}
                onChange={(e) => set("url", e.target.value)}
                className="font-mono text-sm"
                placeholder="zequel.xyz/workspace"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Points</Label>
              <Button type="button" size="sm" variant="outline" onClick={addPoint}>
                <Plus className="size-4" /> Add point
              </Button>
            </div>
            <div className="space-y-2">
              {draft.points.length === 0 && (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  No points yet. Add one to highlight a capability.
                </p>
              )}
              {draft.points.map((point, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={point.icon}
                    onChange={(e) => setPoint(i, "icon", e.target.value)}
                    className="w-32 shrink-0 font-mono text-xs"
                    placeholder="Icon"
                    aria-label={`Point ${i + 1} icon`}
                  />
                  <Input
                    value={point.text}
                    onChange={(e) => setPoint(i, "text", e.target.value)}
                    className="text-sm"
                    placeholder="Point text"
                    aria-label={`Point ${i + 1} text`}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9 shrink-0"
                    onClick={() => removePoint(i)}
                    aria-label={`Remove point ${i + 1}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Icon names come from Lucide (e.g. FileSearch, Quote, Database). Unknown names fall back to a default icon.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pl-status">Status</Label>
            <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
              <SelectTrigger id="pl-status" className="h-9">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)} disabled={!valid}>
            {draft.id ? "Save changes" : "Create pillar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

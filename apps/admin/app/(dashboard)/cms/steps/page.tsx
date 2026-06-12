"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, MoreHorizontal, Send, ListOrdered } from "lucide-react"
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
import type { StepItem, PublishStatus } from "@zequel/types"

const RESOURCE = "steps"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const EMPTY: StepItem = {
  id: "",
  step: "",
  title: "",
  body: "",
  order: 0,
  status: "draft",
  updatedAt: "",
}

export default function StepsPage() {
  const { items: steps, isLoading, error, mutate } = useCmsList<StepItem>(RESOURCE)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<StepItem | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return steps
      .filter((s) => !q || s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
      .sort((a, b) => a.order - b.order)
  }, [steps, search])

  const published = steps.filter((s) => s.status === "published").length

  function openNew() {
    setEditing({ ...EMPTY, order: steps.length + 1, step: String(steps.length + 1).padStart(2, "0") })
    setOpen(true)
  }
  function openEdit(s: StepItem) {
    setEditing({ ...s })
    setOpen(true)
  }

  async function save(s: StepItem) {
    const { id, updatedAt, ...payload } = s
    try {
      if (id) {
        await updateCmsItem<StepItem>(RESOURCE, id, payload)
        toast.success(`"${s.title}" saved`)
      } else {
        await createCmsItem<StepItem>(RESOURCE, payload)
        toast.success(`"${s.title}" created`)
      }
      await mutate()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  async function publish(id: string) {
    try {
      await updateCmsItem<StepItem>(RESOURCE, id, { status: "published" })
      await mutate()
      toast.success("Step published")
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
      <PageHeader title="How it works" description="The numbered workflow steps shown on the home page.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New step
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(steps.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Drafts" value={formatNumber(steps.length - published)} />
        <StatCard label="Order range" value={steps.length ? `1–${steps.length}` : "—"} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load steps: {error.message}
          </p>
        )}
        <TableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search steps..." />

        <DataTableCard>
          <DataTable<StepItem>
            rows={filtered}
            rowKey={(s) => s.id}
            empty="No steps found."
            columns={[
              {
                key: "step",
                header: "#",
                className: "w-16",
                cell: (s) => <span className="font-mono text-sm font-semibold text-muted-foreground">{s.step}</span>,
              },
              {
                key: "title",
                header: "Step",
                cell: (s) => (
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <ListOrdered className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{s.body}</p>
                    </div>
                  </div>
                ),
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
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Step actions">
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
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(s.id, s.title)}>
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
          {isLoading ? "Loading steps…" : `Showing ${filtered.length} of ${steps.length} steps`}
        </p>
      </div>

      {editing && (
        <StepEditDialog key={editing.id || "new"} open={open} onOpenChange={setOpen} step={editing} onSave={save} />
      )}
    </>
  )
}

function StepEditDialog({
  open,
  onOpenChange,
  step,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  step: StepItem
  onSave: (s: StepItem) => void
}) {
  const [draft, setDraft] = useState<StepItem>(step)

  function set<K extends keyof StepItem>(key: K, value: StepItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.title.trim().length > 1 && draft.body.trim().length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit step" : "New step"}</DialogTitle>
          <DialogDescription>A single step in the home page workflow.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="step-num">Step label</Label>
              <Input id="step-num" value={draft.step} onChange={(e) => set("step", e.target.value)} placeholder="01" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-order">Order</Label>
              <Input
                id="step-order"
                inputMode="numeric"
                value={String(draft.order)}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="step-title">Title</Label>
            <Input id="step-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="step-body">Body</Label>
            <Textarea
              id="step-body"
              value={draft.body}
              onChange={(e) => set("body", e.target.value)}
              className="min-h-[80px] resize-none text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="step-status">Status</Label>
            <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
              <SelectTrigger id="step-status" className="h-9">
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
            {draft.id ? "Save changes" : "Create step"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

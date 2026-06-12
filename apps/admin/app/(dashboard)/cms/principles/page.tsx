"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, MoreHorizontal, Send, Compass } from "lucide-react"
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
import type { PrincipleItem, PublishStatus } from "@zequel/types"

const RESOURCE = "principles"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const EMPTY: PrincipleItem = {
  id: "",
  title: "",
  body: "",
  order: 0,
  status: "draft",
  updatedAt: "",
}

export default function PrinciplesPage() {
  const { items: principles, isLoading, error, mutate } = useCmsList<PrincipleItem>(RESOURCE)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<PrincipleItem | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return principles
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
      .sort((a, b) => a.order - b.order)
  }, [principles, search])

  const published = principles.filter((p) => p.status === "published").length

  function openNew() {
    setEditing({ ...EMPTY, order: principles.length + 1 })
    setOpen(true)
  }
  function openEdit(p: PrincipleItem) {
    setEditing({ ...p })
    setOpen(true)
  }

  async function save(p: PrincipleItem) {
    const { id, updatedAt, ...payload } = p
    try {
      if (id) {
        await updateCmsItem<PrincipleItem>(RESOURCE, id, payload)
        toast.success(`"${p.title}" saved`)
      } else {
        await createCmsItem<PrincipleItem>(RESOURCE, payload)
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
      await updateCmsItem<PrincipleItem>(RESOURCE, id, { status: "published" })
      await mutate()
      toast.success("Principle published")
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
      <PageHeader title="Principles" description="The “what we build by” cards shown on the about page.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New principle
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(principles.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Drafts" value={formatNumber(principles.length - published)} />
        <StatCard label="Order range" value={principles.length ? `1–${principles.length}` : "—"} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load principles: {error.message}
          </p>
        )}
        <TableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search principles..." />

        <DataTableCard>
          <DataTable<PrincipleItem>
            rows={filtered}
            rowKey={(p) => p.id}
            empty="No principles found."
            columns={[
              {
                key: "order",
                header: "#",
                className: "w-12",
                cell: (p) => <span className="font-mono text-xs text-muted-foreground">{p.order}</span>,
              },
              {
                key: "title",
                header: "Principle",
                cell: (p) => (
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <Compass className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{p.body}</p>
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
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Principle actions">
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
          {isLoading ? "Loading principles…" : `Showing ${filtered.length} of ${principles.length} principles`}
        </p>
      </div>

      {editing && (
        <PrincipleEditDialog
          key={editing.id || "new"}
          open={open}
          onOpenChange={setOpen}
          principle={editing}
          onSave={save}
        />
      )}
    </>
  )
}

function PrincipleEditDialog({
  open,
  onOpenChange,
  principle,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  principle: PrincipleItem
  onSave: (p: PrincipleItem) => void
}) {
  const [draft, setDraft] = useState<PrincipleItem>(principle)

  function set<K extends keyof PrincipleItem>(key: K, value: PrincipleItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.title.trim().length > 1 && draft.body.trim().length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit principle" : "New principle"}</DialogTitle>
          <DialogDescription>A single principle card on the about page.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="p-title">Title</Label>
            <Input id="p-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-body">Body</Label>
            <Textarea
              id="p-body"
              value={draft.body}
              onChange={(e) => set("body", e.target.value)}
              className="min-h-[90px] resize-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="p-order">Order</Label>
              <Input
                id="p-order"
                inputMode="numeric"
                value={String(draft.order)}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-status">Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
                <SelectTrigger id="p-status" className="h-9">
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
            {draft.id ? "Save changes" : "Create principle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, MoreHorizontal, Send, MessageSquareQuote } from "lucide-react"
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
import type { TestimonialItem, PublishStatus } from "@zequel/types"

const RESOURCE = "testimonials"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const EMPTY: TestimonialItem = {
  id: "",
  quote: "",
  name: "",
  role: "",
  order: 0,
  status: "draft",
  updatedAt: "",
}

export default function TestimonialsPage() {
  const { items: testimonials, isLoading, error, mutate } = useCmsList<TestimonialItem>(RESOURCE)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<TestimonialItem | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return testimonials
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.role.toLowerCase().includes(q) ||
          t.quote.toLowerCase().includes(q),
      )
      .sort((a, b) => a.order - b.order)
  }, [testimonials, search])

  const published = testimonials.filter((t) => t.status === "published").length

  function openNew() {
    setEditing({ ...EMPTY, order: testimonials.length + 1 })
    setOpen(true)
  }
  function openEdit(t: TestimonialItem) {
    setEditing({ ...t })
    setOpen(true)
  }

  async function save(t: TestimonialItem) {
    const { id, updatedAt, ...payload } = t
    try {
      if (id) {
        await updateCmsItem<TestimonialItem>(RESOURCE, id, payload)
        toast.success(`"${t.name}" saved`)
      } else {
        await createCmsItem<TestimonialItem>(RESOURCE, payload)
        toast.success(`"${t.name}" created`)
      }
      await mutate()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  async function publish(id: string) {
    try {
      await updateCmsItem<TestimonialItem>(RESOURCE, id, { status: "published" })
      await mutate()
      toast.success("Testimonial published")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed")
    }
  }

  async function remove(id: string, name: string) {
    try {
      await deleteCmsItem(RESOURCE, id)
      await mutate()
      toast.success(`"${name}" deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  return (
    <>
      <PageHeader title="Testimonials" description="The customer quotes shown on the home page.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New testimonial
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(testimonials.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Drafts" value={formatNumber(testimonials.length - published)} />
        <StatCard label="Shown on home" value={formatNumber(Math.min(published, 3))} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load testimonials: {error.message}
          </p>
        )}
        <TableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search testimonials..." />

        <DataTableCard>
          <DataTable<TestimonialItem>
            rows={filtered}
            rowKey={(t) => t.id}
            empty="No testimonials found."
            columns={[
              {
                key: "order",
                header: "#",
                className: "w-12",
                cell: (t) => <span className="font-mono text-xs text-muted-foreground">{t.order}</span>,
              },
              {
                key: "quote",
                header: "Testimonial",
                cell: (t) => (
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <MessageSquareQuote className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm text-foreground">{t.quote}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.name} · {t.role}
                      </p>
                    </div>
                  </div>
                ),
              },
              { key: "status", header: "Status", cell: (t) => <CmsStatusPill status={t.status} /> },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (t) => (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Testimonial actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(t)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        {t.status !== "published" && (
                          <DropdownMenuItem onSelect={() => publish(t.id)}>
                            <Send className="size-4" /> Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(t.id, t.name)}>
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
          {isLoading ? "Loading testimonials…" : `Showing ${filtered.length} of ${testimonials.length} testimonials`}
        </p>
      </div>

      {editing && (
        <TestimonialEditDialog
          key={editing.id || "new"}
          open={open}
          onOpenChange={setOpen}
          testimonial={editing}
          onSave={save}
        />
      )}
    </>
  )
}

function TestimonialEditDialog({
  open,
  onOpenChange,
  testimonial,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  testimonial: TestimonialItem
  onSave: (t: TestimonialItem) => void
}) {
  const [draft, setDraft] = useState<TestimonialItem>(testimonial)

  function set<K extends keyof TestimonialItem>(key: K, value: TestimonialItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.quote.trim().length > 1 && draft.name.trim().length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit testimonial" : "New testimonial"}</DialogTitle>
          <DialogDescription>A single customer quote on the home page.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="t-quote">Quote</Label>
            <Textarea
              id="t-quote"
              value={draft.quote}
              onChange={(e) => set("quote", e.target.value)}
              className="min-h-[100px] resize-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-role">Role</Label>
              <Input id="t-role" value={draft.role} onChange={(e) => set("role", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-order">Order</Label>
              <Input
                id="t-order"
                inputMode="numeric"
                value={String(draft.order)}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-status">Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
                <SelectTrigger id="t-status" className="h-9">
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
            {draft.id ? "Save changes" : "Create testimonial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

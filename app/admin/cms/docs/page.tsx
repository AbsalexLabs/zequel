"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, MoreHorizontal, Send, BookText } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import { docArticles as initialDocs } from "@/lib/admin-dashboard/cms-mock-data"
import type { DocArticle, PublishStatus } from "@/lib/admin-dashboard/cms-types"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}
const CATEGORIES = ["Getting Started", "Guides", "API Reference", "Integrations", "Troubleshooting"]

const EMPTY: DocArticle = {
  id: "",
  title: "",
  slug: "",
  category: "Guides",
  status: "draft",
  readingMinutes: 3,
  order: 0,
  updatedAt: "",
  updatedBy: "You",
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function CmsDocsPage() {
  const [docs, setDocs] = useState<DocArticle[]>(initialDocs)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [category, setCategory] = useState("all")
  const [editing, setEditing] = useState<DocArticle | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs
      .filter((d) => {
        const matchesSearch = !q || d.title.toLowerCase().includes(q) || d.slug.toLowerCase().includes(q)
        const matchesStatus = status === "all" || d.status === status
        const matchesCategory = category === "all" || d.category === category
        return matchesSearch && matchesStatus && matchesCategory
      })
      .sort((a, b) => a.order - b.order)
  }, [docs, search, status, category])

  const published = docs.filter((d) => d.status === "published").length
  const drafts = docs.filter((d) => d.status === "draft").length

  function openNew() {
    setEditing({ ...EMPTY })
    setOpen(true)
  }
  function openEdit(d: DocArticle) {
    setEditing({ ...d })
    setOpen(true)
  }

  function save(doc: DocArticle) {
    const now = new Date().toISOString()
    const withSlug = { ...doc, slug: doc.slug || slugify(doc.title) }
    if (doc.id) {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...withSlug, updatedAt: now } : d)))
      toast.success(`"${doc.title}" saved`)
    } else {
      const created: DocArticle = {
        ...withSlug,
        id: `doc_${Math.random().toString(36).slice(2, 7)}`,
        order: docs.length + 1,
        updatedAt: now,
      }
      setDocs((prev) => [...prev, created])
      toast.success(`"${doc.title}" created`)
    }
    setOpen(false)
  }

  function publish(id: string) {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "published", updatedAt: new Date().toISOString() } : d)),
    )
    toast.success("Article published")
  }

  function remove(id: string, title: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    toast.success(`"${title}" deleted`)
  }

  return (
    <>
      <PageHeader title="Documentation" description="Help center articles, organized by category and reading order.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New article
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Articles" value={formatNumber(docs.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Drafts" value={formatNumber(drafts)} />
        <StatCard label="Categories" value={formatNumber(CATEGORIES.length)} />
      </section>

      <div className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search articles..."
          filters={[
            {
              id: "category",
              label: "Category",
              value: category,
              onChange: setCategory,
              options: [{ label: "All categories", value: "all" }, ...CATEGORIES.map((c) => ({ label: c, value: c }))],
            },
            {
              id: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { label: "All status", value: "all" },
                ...STATUSES.map((s) => ({ label: STATUS_LABEL[s], value: s })),
              ],
            },
          ]}
        />

        <DataTableCard>
          <DataTable<DocArticle>
            rows={filtered}
            rowKey={(d) => d.id}
            empty="No articles found."
            columns={[
              {
                key: "title",
                header: "Article",
                cell: (d) => (
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <BookText className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">/docs/{d.slug}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "category",
                header: "Category",
                cell: (d) => <span className="text-sm text-muted-foreground">{d.category}</span>,
              },
              {
                key: "reading",
                header: "Read",
                cell: (d) => <span className="tabular-nums text-sm text-muted-foreground">{d.readingMinutes} min</span>,
              },
              { key: "status", header: "Status", cell: (d) => <CmsStatusPill status={d.status} /> },
              {
                key: "updated",
                header: "Updated",
                cell: (d) => <span className="text-sm text-muted-foreground">{relativeTime(d.updatedAt)}</span>,
              },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (d) => (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Article actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(d)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        {d.status !== "published" && (
                          <DropdownMenuItem onSelect={() => publish(d.id)}>
                            <Send className="size-4" /> Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(d.id, d.title)}>
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
          Showing {filtered.length} of {docs.length} articles
        </p>
      </div>

      <DocEditDialog key={editing?.id || "new"} open={open} onOpenChange={setOpen} doc={editing} onSave={save} />
    </>
  )
}

function DocEditDialog({
  open,
  onOpenChange,
  doc,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  doc: DocArticle | null
  onSave: (doc: DocArticle) => void
}) {
  const [draft, setDraft] = useState<DocArticle>(doc ?? EMPTY)

  function set<K extends keyof DocArticle>(key: K, value: DocArticle[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.title.trim().length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit article" : "New article"}</DialogTitle>
          <DialogDescription>Documentation article metadata and placement.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Quickstart in 5 minutes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-slug">Slug</Label>
            <Input
              id="doc-slug"
              value={draft.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="auto-generated from title"
              className="font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="doc-category">Category</Label>
              <Select value={draft.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger id="doc-category" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-reading">Reading minutes</Label>
              <Input
                id="doc-reading"
                inputMode="numeric"
                value={String(draft.readingMinutes)}
                onChange={(e) => set("readingMinutes", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-status">Status</Label>
            <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
              <SelectTrigger id="doc-status" className="h-9">
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
            {draft.id ? "Save changes" : "Create article"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

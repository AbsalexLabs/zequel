"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, ExternalLink, Trash2, MoreHorizontal, Send, FileText } from "lucide-react"
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
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import { useCmsList, createCmsItem, updateCmsItem, deleteCmsItem } from "@/lib/admin-dashboard/cms-api"
import type { CmsPage, PublishStatus } from "@/lib/admin-dashboard/cms-types"

const RESOURCE = "pages"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const EMPTY: CmsPage = {
  id: "",
  title: "",
  slug: "/",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  sections: 0,
  updatedAt: "",
  updatedBy: "You",
}

export default function CmsPagesPage() {
  const { items: pages, isLoading, error, mutate } = useCmsList<CmsPage>(RESOURCE)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [editing, setEditing] = useState<CmsPage | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pages.filter((p) => {
      const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      const matchesStatus = status === "all" || p.status === status
      return matchesSearch && matchesStatus
    })
  }, [pages, search, status])

  const published = pages.filter((p) => p.status === "published").length
  const drafts = pages.filter((p) => p.status === "draft").length
  const scheduled = pages.filter((p) => p.status === "scheduled").length

  function openNew() {
    setEditing({ ...EMPTY })
    setOpen(true)
  }
  function openEdit(page: CmsPage) {
    setEditing({ ...page })
    setOpen(true)
  }

  async function save(page: CmsPage) {
    const { id, updatedAt, ...payload } = page
    try {
      if (id) {
        await updateCmsItem<CmsPage>(RESOURCE, id, payload)
        toast.success(`"${page.title}" saved`)
      } else {
        await createCmsItem<CmsPage>(RESOURCE, payload)
        toast.success(`"${page.title}" created`)
      }
      await mutate()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  async function publish(id: string) {
    try {
      await updateCmsItem<CmsPage>(RESOURCE, id, { status: "published" })
      await mutate()
      toast.success("Page published to live site")
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
      <PageHeader title="Pages" description="Top-level pages of the public website, their SEO metadata, and publish state.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New page
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={formatNumber(pages.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Drafts" value={formatNumber(drafts)} />
        <StatCard label="Scheduled" value={formatNumber(scheduled)} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load pages: {error.message}
          </p>
        )}
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search pages..."
          filters={[
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
          <DataTable<CmsPage>
            rows={filtered}
            rowKey={(p) => p.id}
            empty="No pages found."
            columns={[
              {
                key: "title",
                header: "Page",
                cell: (p) => (
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <FileText className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{p.slug}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "seo",
                header: "SEO title",
                cell: (p) => <span className="line-clamp-1 text-sm text-muted-foreground">{p.seoTitle || "—"}</span>,
              },
              {
                key: "sections",
                header: "Sections",
                cell: (p) => <span className="tabular-nums text-sm text-muted-foreground">{p.sections}</span>,
              },
              { key: "status", header: "Status", cell: (p) => <CmsStatusPill status={p.status} /> },
              {
                key: "updated",
                header: "Updated",
                cell: (p) => (
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{relativeTime(p.updatedAt)}</p>
                    <p className="truncate text-[11px] text-muted-foreground">by {p.updatedBy}</p>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (p) => (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Page actions">
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
                        <DropdownMenuItem asChild>
                          <a href={p.slug} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" /> View live
                          </a>
                        </DropdownMenuItem>
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
          {isLoading ? "Loading pages…" : `Showing ${filtered.length} of ${pages.length} pages`}
        </p>
      </div>

      <PageEditDialog key={editing?.id || "new"} open={open} onOpenChange={setOpen} page={editing} onSave={save} />
    </>
  )
}

function PageEditDialog({
  open,
  onOpenChange,
  page,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  page: CmsPage | null
  onSave: (page: CmsPage) => void
}) {
  const [draft, setDraft] = useState<CmsPage>(page ?? EMPTY)

  function set<K extends keyof CmsPage>(key: K, value: CmsPage[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.title.trim().length > 1 && draft.slug.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit page" : "New page"}</DialogTitle>
          <DialogDescription>Content and SEO metadata for this page.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="page-title">Title</Label>
              <Input id="page-title" value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="About" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-slug">Slug</Label>
              <Input
                id="page-slug"
                value={draft.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="/about"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-seo-title">SEO title</Label>
            <Input
              id="page-seo-title"
              value={draft.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              placeholder="About — Zequel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-seo-desc">SEO description</Label>
            <Textarea
              id="page-seo-desc"
              value={draft.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              placeholder="A short description for search engines and social cards."
              className="min-h-[80px] resize-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="page-status">Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
                <SelectTrigger id="page-status" className="h-9">
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
            <div className="space-y-2">
              <Label htmlFor="page-sections">Sections</Label>
              <Input
                id="page-sections"
                inputMode="numeric"
                value={String(draft.sections)}
                onChange={(e) => set("sections", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)} disabled={!valid}>
            {draft.id ? "Save changes" : "Create page"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

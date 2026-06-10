"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, MoreHorizontal, Send, Eye } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DataTable, DataTableCard, TableToolbar } from "@/components/admin/data-table"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { Button } from "@zequel/ui/components/button"
import { Input } from "@zequel/ui/components/input"
import { Label } from "@zequel/ui/components/label"
import { Textarea } from "@zequel/ui/components/textarea"
import { Badge } from "@zequel/ui/components/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@zequel/ui/components/select"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import { useCmsList, createCmsItem, updateCmsItem, deleteCmsItem } from "@/lib/admin-dashboard/cms-api"
import type { BlogPost, PublishStatus } from "@zequel/types"

const RESOURCE = "blog"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const EMPTY: BlogPost = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  author: "You",
  tags: [],
  status: "draft",
  publishedAt: null,
  updatedAt: "",
  views: 0,
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function CmsBlogPage() {
  const { items: posts, isLoading, error, mutate } = useCmsList<BlogPost>(RESOURCE)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return posts.filter((p) => {
      const matchesSearch =
        !q || p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
      const matchesStatus = status === "all" || p.status === status
      return matchesSearch && matchesStatus
    })
  }, [posts, search, status])

  const published = posts.filter((p) => p.status === "published").length
  const drafts = posts.filter((p) => p.status === "draft").length
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0)

  function openNew() {
    setEditing({ ...EMPTY })
    setOpen(true)
  }
  function openEdit(p: BlogPost) {
    setEditing({ ...p })
    setOpen(true)
  }

  async function save(post: BlogPost) {
    const withSlug = { ...post, slug: post.slug || slugify(post.title) }
    const { id, updatedAt, ...payload } = withSlug
    try {
      if (id) {
        await updateCmsItem<BlogPost>(RESOURCE, id, payload)
        toast.success(`"${post.title}" saved`)
      } else {
        await createCmsItem<BlogPost>(RESOURCE, payload)
        toast.success(`"${post.title}" created`)
      }
      await mutate()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  async function publish(id: string) {
    try {
      await updateCmsItem<BlogPost>(RESOURCE, id, {
        status: "published",
        publishedAt: new Date().toISOString(),
      })
      await mutate()
      toast.success("Post published to blog")
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
      <PageHeader title="Blog" description="Articles and announcements published to the public blog.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New post
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Posts" value={formatNumber(posts.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Drafts" value={formatNumber(drafts)} />
        <StatCard label="Total views" value={formatNumber(totalViews)} />
      </section>

      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load posts: {error.message}
          </p>
        )}
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search posts or tags..."
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
          <DataTable<BlogPost>
            rows={filtered}
            rowKey={(p) => p.id}
            empty="No posts found."
            columns={[
              {
                key: "title",
                header: "Post",
                cell: (p) => (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {p.tags.length ? (
                        p.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                            {t}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">No tags</span>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: "author",
                header: "Author",
                cell: (p) => <span className="text-sm text-muted-foreground">{p.author}</span>,
              },
              {
                key: "views",
                header: "Views",
                cell: (p) => (
                  <span className="inline-flex items-center gap-1 tabular-nums text-sm text-muted-foreground">
                    <Eye className="size-3.5" />
                    {formatNumber(p.views)}
                  </span>
                ),
              },
              { key: "status", header: "Status", cell: (p) => <CmsStatusPill status={p.status} /> },
              {
                key: "date",
                header: "Published",
                cell: (p) => (
                  <span className="text-sm text-muted-foreground">
                    {p.publishedAt ? relativeTime(p.publishedAt) : "—"}
                  </span>
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
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Post actions">
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
          {isLoading ? "Loading posts…" : `Showing ${filtered.length} of ${posts.length} posts`}
        </p>
      </div>

      <PostEditDialog key={editing?.id || "new"} open={open} onOpenChange={setOpen} post={editing} onSave={save} />
    </>
  )
}

function PostEditDialog({
  open,
  onOpenChange,
  post,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  post: BlogPost | null
  onSave: (post: BlogPost) => void
}) {
  const [draft, setDraft] = useState<BlogPost>(post ?? EMPTY)
  const [tagsText, setTagsText] = useState((post ?? EMPTY).tags.join(", "))

  function set<K extends keyof BlogPost>(key: K, value: BlogPost[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.title.trim().length > 1

  function handleSave() {
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    onSave({ ...draft, tags })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit post" : "New post"}</DialogTitle>
          <DialogDescription>Blog post details, excerpt, and tags.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="How we built verifiable citations"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-excerpt">Excerpt</Label>
            <Textarea
              id="post-excerpt"
              value={draft.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="A short summary shown in blog listings."
              className="min-h-[80px] resize-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="post-author">Author</Label>
              <Input id="post-author" value={draft.author} onChange={(e) => set("author", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-status">Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
                <SelectTrigger id="post-status" className="h-9">
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
          <div className="space-y-2">
            <Label htmlFor="post-tags">Tags</Label>
            <Input
              id="post-tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="engineering, ai, product"
            />
            <p className="text-[11px] text-muted-foreground">Separate tags with commas.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!valid}>
            {draft.id ? "Save changes" : "Create post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

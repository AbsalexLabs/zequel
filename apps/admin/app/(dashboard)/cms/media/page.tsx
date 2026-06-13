"use client"

import { useMemo, useState } from "react"
import { Upload, Trash2, Copy, ImageIcon, FileText, Film, Shapes, Search, LayoutGrid, List } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { TableToolbar, DataTable, DataTableCard } from "@/components/admin/data-table"
import { Button } from "@zequel/ui/components/button"
import { Badge } from "@zequel/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zequel/ui/components/dialog"
import { Input } from "@zequel/ui/components/input"
import { Label } from "@zequel/ui/components/label"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import { useCmsList, createCmsItem, deleteCmsItem } from "@/lib/admin-dashboard/cms-api"
import type { MediaAsset, MediaType } from "@zequel/types"

const RESOURCE = "media"

const TYPE_META: Record<MediaType, { label: string; icon: typeof ImageIcon; className: string }> = {
  image: { label: "Image", icon: ImageIcon, className: "text-sky-600 dark:text-sky-400" },
  video: { label: "Video", icon: Film, className: "text-amber-600 dark:text-amber-400" },
  document: { label: "Document", icon: FileText, className: "text-emerald-600 dark:text-emerald-400" },
  icon: { label: "Icon", icon: Shapes, className: "text-primary" },
}
const TYPES: MediaType[] = ["image", "video", "document", "icon"]

function formatSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export default function CmsMediaPage() {
  const { items: assets, isLoading, error, mutate } = useCmsList<MediaAsset>(RESOURCE)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("all")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [name, setName] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assets
      .filter((a) => {
        const matchesSearch = !q || a.name.toLowerCase().includes(q)
        const matchesType = type === "all" || a.type === type
        return matchesSearch && matchesType
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }, [assets, search, type])

  const totalSize = assets.reduce((sum, a) => sum + a.sizeKb, 0)
  const images = assets.filter((a) => a.type === "image").length

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url).catch(() => {})
    toast.success("URL copied to clipboard")
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

  async function addAsset() {
    const trimmed = name.trim()
    if (!trimmed) return
    const ext = trimmed.split(".").pop()?.toLowerCase() ?? ""
    const inferred: MediaType =
      ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)
        ? "image"
        : ["mp4", "mov", "webm"].includes(ext)
          ? "video"
          : ["svg"].includes(ext)
            ? "icon"
            : "document"
    try {
      await createCmsItem<MediaAsset>(RESOURCE, {
        name: trimmed,
        type: inferred,
        url: `/cms-media/${trimmed}`,
        sizeKb: 120 + Math.floor(Math.random() * 800),
        uploadedBy: "You",
      })
      await mutate()
      toast.success(`"${trimmed}" uploaded`)
      setName("")
      setUploadOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    }
  }

  return (
    <>
      <PageHeader title="Media Library" description="Images, icons, videos, and documents used across the public site.">
        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-md border border-border p-0.5 sm:flex">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              aria-label="Grid view"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              aria-label="List view"
              onClick={() => setView("list")}
            >
              <List className="size-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="size-4" /> Upload
          </Button>
        </div>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assets" value={formatNumber(assets.length)} />
        <StatCard label="Images" value={formatNumber(images)} />
        <StatCard label="Storage used" value={formatSize(totalSize)} />
        <StatCard label="Types" value={formatNumber(TYPES.length)} />
      </section>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search media..."
        filters={[
          {
            id: "type",
            label: "Type",
            value: type,
            onChange: setType,
            options: [{ label: "All types", value: "all" }, ...TYPES.map((t) => ({ label: TYPE_META[t].label, value: t }))],
          },
        ]}
      />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load media: {error.message}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Search className="size-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No media found.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((asset) => {
            const meta = TYPE_META[asset.type]
            const Icon = meta.icon
            return (
              <div
                key={asset.id}
                className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/20"
              >
                <div className="flex aspect-video items-center justify-center bg-secondary/50">
                  <Icon className={`size-8 ${meta.className}`} />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-foreground" title={asset.name}>
                    {asset.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{formatSize(asset.sizeKb)}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      onClick={() => copyUrl(asset.url)}
                    >
                      <Copy className="size-3" /> Copy URL
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      aria-label="Delete asset"
                      onClick={() => remove(asset.id, asset.name)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <DataTableCard>
          <DataTable<MediaAsset>
            rows={filtered}
            rowKey={(a) => a.id}
            empty="No media found."
            columns={[
              {
                key: "name",
                header: "File",
                cell: (a) => {
                  const meta = TYPE_META[a.type]
                  const Icon = meta.icon
                  return (
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                        <Icon className={`size-4 ${meta.className}`} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">{a.url}</p>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: "type",
                header: "Type",
                cell: (a) => (
                  <Badge variant="secondary" className="text-[11px] font-normal">
                    {TYPE_META[a.type].label}
                  </Badge>
                ),
              },
              {
                key: "dimensions",
                header: "Dimensions",
                cell: (a) =>
                  a.width && a.height ? (
                    <span className="tabular-nums text-sm text-muted-foreground">
                      {a.width}×{a.height}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  ),
              },
              {
                key: "size",
                header: "Size",
                cell: (a) => <span className="tabular-nums text-sm text-muted-foreground">{formatSize(a.sizeKb)}</span>,
              },
              {
                key: "uploaded",
                header: "Uploaded",
                cell: (a) => (
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{relativeTime(a.uploadedAt)}</p>
                    <p className="truncate text-[11px] text-muted-foreground">by {a.uploadedBy}</p>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "",
                className: "w-24 text-right",
                cell: (a) => (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Copy URL" onClick={() => copyUrl(a.url)}>
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      aria-label="Delete asset"
                      onClick={() => remove(a.id, a.name)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </DataTableCard>
      )}

      <p className="text-xs text-muted-foreground">
        {isLoading ? "Loading media…" : `Showing ${filtered.length} of ${assets.length} assets`}
      </p>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload media</DialogTitle>
            <DialogDescription>Add a file to the media library. Type is inferred from the extension.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center">
              <Upload className="size-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Drag and drop, or enter a file name below</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-name">File name</Label>
              <Input
                id="media-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="hero-banner.png"
                onKeyDown={(e) => e.key === "Enter" && addAsset()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addAsset} disabled={!name.trim()}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

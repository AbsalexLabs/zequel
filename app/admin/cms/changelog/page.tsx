"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Send, Sparkles, Wrench, Bug, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { TableToolbar } from "@/components/admin/data-table"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatNumber, formatDate } from "@/lib/admin-dashboard/format"
import { changelogEntries as initialEntries } from "@/lib/admin-dashboard/cms-mock-data"
import type { ChangelogEntry, ChangelogType, PublishStatus } from "@/lib/admin-dashboard/cms-types"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const TYPES: ChangelogType[] = ["feature", "improvement", "fix", "security"]
const TYPE_META: Record<ChangelogType, { label: string; icon: typeof Sparkles; className: string }> = {
  feature: { label: "Feature", icon: Sparkles, className: "bg-primary/10 text-primary" },
  improvement: { label: "Improvement", icon: Wrench, className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  fix: { label: "Fix", icon: Bug, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  security: { label: "Security", icon: ShieldCheck, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
}

const EMPTY: ChangelogEntry = {
  id: "",
  version: "",
  title: "",
  type: "feature",
  body: "",
  status: "draft",
  releasedAt: new Date().toISOString(),
}

export default function CmsChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>(initialEntries)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("all")
  const [editing, setEditing] = useState<ChangelogEntry | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries
      .filter((e) => {
        const matchesSearch = !q || e.title.toLowerCase().includes(q) || e.version.toLowerCase().includes(q)
        const matchesType = type === "all" || e.type === type
        return matchesSearch && matchesType
      })
      .sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime())
  }, [entries, search, type])

  const published = entries.filter((e) => e.status === "published").length
  const drafts = entries.filter((e) => e.status === "draft").length

  function openNew() {
    setEditing({ ...EMPTY })
    setOpen(true)
  }
  function openEdit(e: ChangelogEntry) {
    setEditing({ ...e })
    setOpen(true)
  }

  function save(entry: ChangelogEntry) {
    if (entry.id) {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)))
      toast.success(`v${entry.version} saved`)
    } else {
      const created: ChangelogEntry = { ...entry, id: `cl_${Math.random().toString(36).slice(2, 7)}` }
      setEntries((prev) => [created, ...prev])
      toast.success(`v${entry.version} created`)
    }
    setOpen(false)
  }

  function publish(id: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: "published" } : e)))
    toast.success("Changelog entry published")
  }

  function remove(id: string, version: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    toast.success(`v${version} deleted`)
  }

  return (
    <>
      <PageHeader title="Changelog" description="Release notes shown on the public changelog page.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New entry
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Entries" value={formatNumber(entries.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Drafts" value={formatNumber(drafts)} />
        <StatCard label="Latest" value={`v${filtered[0]?.version ?? "—"}`} />
      </section>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by version or title..."
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

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No changelog entries found.
        </div>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {filtered.map((entry) => {
            const meta = TYPE_META[entry.type]
            const Icon = meta.icon
            return (
              <li key={entry.id} className="relative">
                <span
                  className={`absolute -left-[31px] flex size-6 items-center justify-center rounded-full ring-4 ring-background ${meta.className}`}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[11px]">
                          v{entry.version}
                        </Badge>
                        <Badge variant="secondary" className={`gap-1 text-[11px] ${meta.className}`}>
                          {meta.label}
                        </Badge>
                        <CmsStatusPill status={entry.status} />
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-foreground">{entry.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">Released {formatDate(entry.releasedAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {entry.status !== "published" && (
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Publish" onClick={() => publish(entry.id)}>
                          <Send className="size-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Edit" onClick={() => openEdit(entry)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label="Delete"
                        onClick={() => remove(entry.id, entry.version)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <EntryEditDialog key={editing?.id || "new"} open={open} onOpenChange={setOpen} entry={editing} onSave={save} />
    </>
  )
}

function EntryEditDialog({
  open,
  onOpenChange,
  entry,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  entry: ChangelogEntry | null
  onSave: (entry: ChangelogEntry) => void
}) {
  const [draft, setDraft] = useState<ChangelogEntry>(entry ?? EMPTY)

  function set<K extends keyof ChangelogEntry>(key: K, value: ChangelogEntry[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.version.trim().length > 0 && draft.title.trim().length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit entry" : "New entry"}</DialogTitle>
          <DialogDescription>A single release note for the changelog.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cl-version">Version</Label>
              <Input
                id="cl-version"
                value={draft.version}
                onChange={(e) => set("version", e.target.value)}
                placeholder="2.9.0"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-type">Type</Label>
              <Select value={draft.type} onValueChange={(v) => set("type", v as ChangelogType)}>
                <SelectTrigger id="cl-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_META[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cl-title">Title</Label>
            <Input
              id="cl-title"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Team workspaces and shared threads"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cl-body">Description</Label>
            <Textarea
              id="cl-body"
              value={draft.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="What changed in this release."
              className="min-h-[90px] resize-none text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cl-status">Status</Label>
            <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
              <SelectTrigger id="cl-status" className="h-9">
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
            {draft.id ? "Save changes" : "Create entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

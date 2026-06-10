"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Send, ChevronDown, GripVertical } from "lucide-react"
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
import { formatNumber } from "@/lib/admin-dashboard/format"
import { useCmsList, createCmsItem, updateCmsItem, deleteCmsItem } from "@/lib/admin-dashboard/cms-api"
import type { FaqItem, PublishStatus } from "@/lib/admin-dashboard/cms-types"

const RESOURCE = "faq"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}
const CATEGORIES = ["General", "Billing", "Privacy", "Technical"]

const EMPTY: FaqItem = {
  id: "",
  question: "",
  answer: "",
  category: "General",
  order: 0,
  status: "draft",
  updatedAt: "",
}

export default function CmsFaqPage() {
  const { items: faqs, error, mutate } = useCmsList<FaqItem>(RESOURCE)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [editing, setEditing] = useState<FaqItem | null>(null)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return faqs
      .filter((f) => {
        const matchesSearch = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
        const matchesCategory = category === "all" || f.category === category
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => a.order - b.order)
  }, [faqs, search, category])

  const published = faqs.filter((f) => f.status === "published").length
  const drafts = faqs.filter((f) => f.status === "draft").length

  function openNew() {
    setEditing({ ...EMPTY })
    setOpen(true)
  }
  function openEdit(f: FaqItem) {
    setEditing({ ...f })
    setOpen(true)
  }

  async function save(faq: FaqItem) {
    const { id, updatedAt, ...payload } = faq
    try {
      if (id) {
        await updateCmsItem<FaqItem>(RESOURCE, id, payload)
        toast.success("FAQ saved")
      } else {
        await createCmsItem<FaqItem>(RESOURCE, { ...payload, order: faqs.length + 1 })
        toast.success("FAQ created")
      }
      await mutate()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  async function publish(id: string) {
    try {
      await updateCmsItem<FaqItem>(RESOURCE, id, { status: "published" })
      await mutate()
      toast.success("FAQ published")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed")
    }
  }

  async function remove(id: string) {
    try {
      await deleteCmsItem(RESOURCE, id)
      await mutate()
      toast.success("FAQ deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  return (
    <>
      <PageHeader title="FAQ" description="Frequently asked questions grouped by category for the public site.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New question
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Questions" value={formatNumber(faqs.length)} />
        <StatCard label="Published" value={formatNumber(published)} />
        <StatCard label="Drafts" value={formatNumber(drafts)} />
        <StatCard label="Categories" value={formatNumber(CATEGORIES.length)} />
      </section>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search questions..."
        filters={[
          {
            id: "category",
            label: "Category",
            value: category,
            onChange: setCategory,
            options: [{ label: "All categories", value: "all" }, ...CATEGORIES.map((c) => ({ label: c, value: c }))],
          },
        ]}
      />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load FAQ: {error.message}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No questions found.
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {filtered.map((faq) => {
            const isOpen = expanded === faq.id
            return (
              <div key={faq.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <GripVertical className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => setExpanded(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                    <span className="truncate text-sm font-medium text-foreground">{faq.question}</span>
                  </button>
                  <Badge variant="secondary" className="hidden shrink-0 text-[11px] font-normal sm:inline-flex">
                    {faq.category}
                  </Badge>
                  <CmsStatusPill status={faq.status} />
                  <div className="flex shrink-0 items-center gap-1">
                    {faq.status !== "published" && (
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Publish" onClick={() => publish(faq.id)}>
                        <Send className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Edit" onClick={() => openEdit(faq)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      aria-label="Delete"
                      onClick={() => remove(faq.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 pl-[3.25rem] text-sm leading-relaxed text-muted-foreground">{faq.answer}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <FaqEditDialog key={editing?.id || "new"} open={open} onOpenChange={setOpen} faq={editing} onSave={save} />
    </>
  )
}

function FaqEditDialog({
  open,
  onOpenChange,
  faq,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  faq: FaqItem | null
  onSave: (faq: FaqItem) => void
}) {
  const [draft, setDraft] = useState<FaqItem>(faq ?? EMPTY)

  function set<K extends keyof FaqItem>(key: K, value: FaqItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.question.trim().length > 3 && draft.answer.trim().length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit question" : "New question"}</DialogTitle>
          <DialogDescription>A single FAQ entry shown on the public site.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="faq-question">Question</Label>
            <Input
              id="faq-question"
              value={draft.question}
              onChange={(e) => set("question", e.target.value)}
              placeholder="Is there a free plan?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-answer">Answer</Label>
            <Textarea
              id="faq-answer"
              value={draft.answer}
              onChange={(e) => set("answer", e.target.value)}
              placeholder="Yes — the Free plan includes 50 AI requests per day."
              className="min-h-[100px] resize-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="faq-category">Category</Label>
              <Select value={draft.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger id="faq-category" className="h-9">
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
              <Label htmlFor="faq-status">Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
                <SelectTrigger id="faq-status" className="h-9">
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
            {draft.id ? "Save changes" : "Create question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

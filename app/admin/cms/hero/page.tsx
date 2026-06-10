"use client"

import { useState } from "react"
import { Pencil, Send, PanelTop } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { Card } from "@/components/ui/card"
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
import { relativeTime } from "@/lib/admin-dashboard/format"
import { useCmsList, updateCmsItem } from "@/lib/admin-dashboard/cms-api"
import type { HeroSection } from "@/lib/admin-dashboard/cms-types"

const RESOURCE = "hero"

export default function HeroPage() {
  const { items: heroes, error, mutate } = useCmsList<HeroSection>(RESOURCE)
  const [editing, setEditing] = useState<HeroSection | null>(null)
  const [open, setOpen] = useState(false)

  function openEdit(hero: HeroSection) {
    setEditing({ ...hero })
    setOpen(true)
  }

  async function save(hero: HeroSection) {
    const { id, updatedAt, ...payload } = hero
    try {
      await updateCmsItem<HeroSection>(RESOURCE, id, payload)
      await mutate()
      toast.success(`${hero.page} hero saved`)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  async function publish(id: string, page: string) {
    try {
      await updateCmsItem<HeroSection>(RESOURCE, id, { status: "published" })
      await mutate()
      toast.success(`${page} hero published`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed")
    }
  }

  return (
    <>
      <PageHeader
        title="Hero Sections"
        description="The headline, sub-headline, and call-to-action shown at the top of each page."
      />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load hero sections: {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {heroes.map((hero) => (
          <Card key={hero.id} className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-md bg-secondary">
                  <PanelTop className="size-4 text-foreground" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{hero.page}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">Hero section</p>
                </div>
              </div>
              <CmsStatusPill status={hero.status} />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{hero.eyebrow}</p>
              <p className="text-balance text-lg font-semibold leading-tight text-foreground">{hero.headline}</p>
              <p className="text-pretty text-sm text-muted-foreground">{hero.subhead}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                  {hero.primaryCtaLabel}
                </span>
                <span className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                  {hero.secondaryCtaLabel}
                </span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Updated {relativeTime(hero.updatedAt)}</span>
              <div className="flex gap-2">
                {hero.status !== "published" && (
                  <Button size="sm" variant="outline" onClick={() => publish(hero.id, hero.page)}>
                    <Send className="size-4" /> Publish
                  </Button>
                )}
                <Button size="sm" onClick={() => openEdit(hero)}>
                  <Pencil className="size-4" /> Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <HeroEditDialog key={editing.id} open={open} onOpenChange={setOpen} hero={editing} onSave={save} />
      )}
    </>
  )
}

function HeroEditDialog({
  open,
  onOpenChange,
  hero,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  hero: HeroSection
  onSave: (hero: HeroSection) => void
}) {
  const [draft, setDraft] = useState<HeroSection>(hero)

  function set<K extends keyof HeroSection>(key: K, value: HeroSection[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const valid = draft.headline.trim().length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {draft.page} hero</DialogTitle>
          <DialogDescription>Headline, sub-headline, and call-to-action buttons.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="hero-eyebrow">Eyebrow</Label>
            <Input id="hero-eyebrow" value={draft.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-headline">Headline</Label>
            <Textarea
              id="hero-headline"
              value={draft.headline}
              onChange={(e) => set("headline", e.target.value)}
              className="min-h-[60px] resize-none text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-subhead">Sub-headline</Label>
            <Textarea
              id="hero-subhead"
              value={draft.subhead}
              onChange={(e) => set("subhead", e.target.value)}
              className="min-h-[70px] resize-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hero-pcta">Primary CTA label</Label>
              <Input id="hero-pcta" value={draft.primaryCtaLabel} onChange={(e) => set("primaryCtaLabel", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-pctah">Primary CTA link</Label>
              <Input
                id="hero-pctah"
                value={draft.primaryCtaHref}
                onChange={(e) => set("primaryCtaHref", e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-scta">Secondary CTA label</Label>
              <Input
                id="hero-scta"
                value={draft.secondaryCtaLabel}
                onChange={(e) => set("secondaryCtaLabel", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-sctah">Secondary CTA link</Label>
              <Input
                id="hero-sctah"
                value={draft.secondaryCtaHref}
                onChange={(e) => set("secondaryCtaHref", e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)} disabled={!valid}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

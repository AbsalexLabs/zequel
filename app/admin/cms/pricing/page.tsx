"use client"

import { useState } from "react"
import { Plus, Pencil, Send, Trash2, Check, Star, X } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/page-header"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/admin-dashboard/format"
import { pricingPlans as initialPlans } from "@/lib/admin-dashboard/cms-mock-data"
import type { PricingPlan, PublishStatus } from "@/lib/admin-dashboard/cms-types"

const STATUSES: PublishStatus[] = ["published", "draft", "scheduled", "archived"]
const STATUS_LABEL: Record<PublishStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
}

const EMPTY: PricingPlan = {
  id: "",
  name: "",
  priceMonthly: 0,
  priceYearly: 0,
  description: "",
  features: [],
  highlighted: false,
  ctaLabel: "Get started",
  status: "draft",
  order: 0,
  updatedAt: "",
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>(initialPlans)
  const [editing, setEditing] = useState<PricingPlan | null>(null)
  const [open, setOpen] = useState(false)

  const sorted = [...plans].sort((a, b) => a.order - b.order)

  function openNew() {
    setEditing({ ...EMPTY, order: plans.length + 1 })
    setOpen(true)
  }
  function openEdit(p: PricingPlan) {
    setEditing({ ...p })
    setOpen(true)
  }

  function save(p: PricingPlan) {
    const now = new Date().toISOString()
    if (p.id) {
      setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...p, updatedAt: now } : x)))
      toast.success(`${p.name} plan saved`)
    } else {
      setPlans((prev) => [...prev, { ...p, id: `plan_${Math.random().toString(36).slice(2, 7)}`, updatedAt: now }])
      toast.success(`${p.name} plan created`)
    }
    setOpen(false)
  }

  function publish(id: string) {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "published", updatedAt: new Date().toISOString() } : p)),
    )
    toast.success("Plan published")
  }

  function remove(id: string, name: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id))
    toast.success(`${name} plan deleted`)
  }

  return (
    <>
      <PageHeader title="Pricing" description="Plans, prices, and feature lists shown on the pricing page.">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New plan
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {sorted.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col gap-4 p-5 ${plan.highlighted ? "border-foreground ring-1 ring-foreground" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                {plan.highlighted && <Star className="size-3.5 fill-foreground text-foreground" />}
              </div>
              <CmsStatusPill status={plan.status} />
            </div>

            <div>
              <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                {plan.priceMonthly === 0 ? (plan.name === "Enterprise" ? "Custom" : "Free") : formatCurrency(plan.priceMonthly)}
              </span>
              {plan.priceMonthly > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
            </div>

            <p className="text-pretty text-xs text-muted-foreground">{plan.description}</p>

            <ul className="space-y-1.5">
              {plan.features.slice(0, 5).map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              <span className="rounded-md bg-secondary px-2.5 py-1.5 text-center text-xs font-medium text-secondary-foreground">
                {plan.ctaLabel}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(plan)}>
                  <Pencil className="size-4" /> Edit
                </Button>
                {plan.status !== "published" ? (
                  <Button size="sm" variant="outline" onClick={() => publish(plan.id)} aria-label="Publish">
                    <Send className="size-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => remove(plan.id, plan.name)}
                    aria-label="Delete plan"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <PlanEditDialog key={editing.id || "new"} open={open} onOpenChange={setOpen} plan={editing} onSave={save} />
      )}
    </>
  )
}

function PlanEditDialog({
  open,
  onOpenChange,
  plan,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  plan: PricingPlan
  onSave: (p: PricingPlan) => void
}) {
  const [draft, setDraft] = useState<PricingPlan>(plan)
  const [newFeature, setNewFeature] = useState("")

  function set<K extends keyof PricingPlan>(key: K, value: PricingPlan[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function addFeature() {
    const v = newFeature.trim()
    if (!v) return
    set("features", [...draft.features, v])
    setNewFeature("")
  }

  function removeFeature(idx: number) {
    set(
      "features",
      draft.features.filter((_, i) => i !== idx),
    )
  }

  const valid = draft.name.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? `Edit ${draft.name} plan` : "New plan"}</DialogTitle>
          <DialogDescription>Pricing, description, and included features.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Name</Label>
              <Input id="plan-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-cta">CTA label</Label>
              <Input id="plan-cta" value={draft.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-monthly">Monthly price ($)</Label>
              <Input
                id="plan-monthly"
                inputMode="numeric"
                value={String(draft.priceMonthly)}
                onChange={(e) => set("priceMonthly", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-yearly">Yearly price ($)</Label>
              <Input
                id="plan-yearly"
                inputMode="numeric"
                value={String(draft.priceYearly)}
                onChange={(e) => set("priceYearly", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-desc">Description</Label>
            <Textarea
              id="plan-desc"
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[60px] resize-none text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Features</Label>
            <ul className="space-y-2">
              {draft.features.map((f, idx) => (
                <li key={`${f}-${idx}`} className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-1.5">
                  <Check className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm text-foreground">{f}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${f}`}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addFeature()
                  }
                }}
                placeholder="Add a feature..."
                className="h-9 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Highlight this plan</p>
              <p className="text-xs text-muted-foreground">Mark as the recommended option.</p>
            </div>
            <Switch checked={draft.highlighted} onCheckedChange={(v) => set("highlighted", v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plan-order">Order</Label>
              <Input
                id="plan-order"
                inputMode="numeric"
                value={String(draft.order)}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-status">Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as PublishStatus)}>
                <SelectTrigger id="plan-status" className="h-9">
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
            {draft.id ? "Save changes" : "Create plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader, SectionHeader } from "@/components/admin/page-header"
import { RoleGuard } from "@/components/admin/role-guard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5 pr-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

interface SettingsState {
  maintenance: boolean
  signups: boolean
  safetyStrict: boolean
  newModel: boolean
  rlFree: string
  rlPro: string
  rlTeam: string
  defaultModel: string
  maxContext: string
  piiThreshold: string
  reviewSla: string
}

const DEFAULTS: SettingsState = {
  maintenance: false,
  signups: true,
  safetyStrict: true,
  newModel: true,
  rlFree: "50",
  rlPro: "2000",
  rlTeam: "10000",
  defaultModel: "zequel-synthesis-2",
  maxContext: "128000",
  piiThreshold: "0.75",
  reviewSla: "24",
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS)
  const [saved, setSaved] = useState<SettingsState>(DEFAULTS)

  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(saved), [settings, saved])

  function set<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    setSaved(settings)
    toast.success("Settings saved")
  }

  function reset() {
    setSettings(saved)
    toast.message("Changes discarded")
  }

  return (
    <>
      <PageHeader title="System Settings" description="Platform configuration, limits, and feature flags. Superadmin access only.">
        {dirty && (
          <Button variant="outline" size="sm" onClick={reset}>
            Discard
          </Button>
        )}
        <Button size="sm" onClick={save} disabled={!dirty}>
          Save changes
        </Button>
      </PageHeader>

      <RoleGuard required="superadmin">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-0">
              <SectionHeader title="Platform" description="Global availability and access" className="pb-2" />
              <Separator />
              <SettingRow title="Maintenance mode" description="Temporarily disable access for all non-admin users.">
                <Switch checked={settings.maintenance} onCheckedChange={(v) => set("maintenance", v)} />
              </SettingRow>
              <Separator />
              <SettingRow title="Open signups" description="Allow new users to register without an invite.">
                <Switch checked={settings.signups} onCheckedChange={(v) => set("signups", v)} />
              </SettingRow>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-0">
              <SectionHeader title="Rate Limits" description="Per-user request ceilings" className="pb-2" />
              <Separator />
              <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rl-free" className="text-xs text-muted-foreground">
                    Free tier (req/day)
                  </Label>
                  <Input
                    id="rl-free"
                    inputMode="numeric"
                    value={settings.rlFree}
                    onChange={(e) => set("rlFree", e.target.value)}
                    className="tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rl-pro" className="text-xs text-muted-foreground">
                    Pro tier (req/day)
                  </Label>
                  <Input
                    id="rl-pro"
                    inputMode="numeric"
                    value={settings.rlPro}
                    onChange={(e) => set("rlPro", e.target.value)}
                    className="tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rl-team" className="text-xs text-muted-foreground">
                    Team tier (req/day)
                  </Label>
                  <Input
                    id="rl-team"
                    inputMode="numeric"
                    value={settings.rlTeam}
                    onChange={(e) => set("rlTeam", e.target.value)}
                    className="tabular-nums"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-0">
              <SectionHeader title="AI & Models" description="Inference defaults and rollout" className="pb-2" />
              <Separator />
              <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="default-model" className="text-xs text-muted-foreground">
                    Default model
                  </Label>
                  <Input
                    id="default-model"
                    value={settings.defaultModel}
                    onChange={(e) => set("defaultModel", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-context" className="text-xs text-muted-foreground">
                    Max context (tokens)
                  </Label>
                  <Input
                    id="max-context"
                    inputMode="numeric"
                    value={settings.maxContext}
                    onChange={(e) => set("maxContext", e.target.value)}
                    className="tabular-nums"
                  />
                </div>
              </div>
              <Separator />
              <SettingRow title="New model rollout" description="Expose zequel-reason-1.5 to Team and Enterprise tiers.">
                <Switch checked={settings.newModel} onCheckedChange={(v) => set("newModel", v)} />
              </SettingRow>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-0">
              <SectionHeader title="Safety" description="Moderation enforcement" className="pb-2" />
              <Separator />
              <SettingRow
                title="Strict safety filtering"
                description="Block flagged prompts automatically instead of queuing for review."
              >
                <Switch checked={settings.safetyStrict} onCheckedChange={(v) => set("safetyStrict", v)} />
              </SettingRow>
              <Separator />
              <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pii-threshold" className="text-xs text-muted-foreground">
                    PII detection threshold
                  </Label>
                  <Input
                    id="pii-threshold"
                    inputMode="decimal"
                    value={settings.piiThreshold}
                    onChange={(e) => set("piiThreshold", e.target.value)}
                    className="tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="review-sla" className="text-xs text-muted-foreground">
                    Review SLA (hours)
                  </Label>
                  <Input
                    id="review-sla"
                    inputMode="numeric"
                    value={settings.reviewSla}
                    onChange={(e) => set("reviewSla", e.target.value)}
                    className="tabular-nums"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    </>
  )
}

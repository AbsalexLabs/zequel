"use client"

import { useState } from "react"
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

export default function SettingsPage() {
  const [maintenance, setMaintenance] = useState(false)
  const [signups, setSignups] = useState(true)
  const [safetyStrict, setSafetyStrict] = useState(true)
  const [newModel, setNewModel] = useState(true)

  return (
    <>
      <PageHeader title="System Settings" description="Platform configuration, limits, and feature flags. Superadmin access only.">
        <Button size="sm">Save changes</Button>
      </PageHeader>

      <RoleGuard required="superadmin">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-0">
              <SectionHeader title="Platform" description="Global availability and access" className="pb-2" />
              <Separator />
              <SettingRow title="Maintenance mode" description="Temporarily disable access for all non-admin users.">
                <Switch checked={maintenance} onCheckedChange={setMaintenance} />
              </SettingRow>
              <Separator />
              <SettingRow title="Open signups" description="Allow new users to register without an invite.">
                <Switch checked={signups} onCheckedChange={setSignups} />
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
                  <Input id="rl-free" defaultValue="50" className="tabular-nums" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rl-pro" className="text-xs text-muted-foreground">
                    Pro tier (req/day)
                  </Label>
                  <Input id="rl-pro" defaultValue="2000" className="tabular-nums" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rl-team" className="text-xs text-muted-foreground">
                    Team tier (req/day)
                  </Label>
                  <Input id="rl-team" defaultValue="10000" className="tabular-nums" />
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
                  <Input id="default-model" defaultValue="zequel-synthesis-2" className="font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-context" className="text-xs text-muted-foreground">
                    Max context (tokens)
                  </Label>
                  <Input id="max-context" defaultValue="128000" className="tabular-nums" />
                </div>
              </div>
              <Separator />
              <SettingRow title="New model rollout" description="Expose zequel-reason-1.5 to Team and Enterprise tiers.">
                <Switch checked={newModel} onCheckedChange={setNewModel} />
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
                <Switch checked={safetyStrict} onCheckedChange={setSafetyStrict} />
              </SettingRow>
              <Separator />
              <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pii-threshold" className="text-xs text-muted-foreground">
                    PII detection threshold
                  </Label>
                  <Input id="pii-threshold" defaultValue="0.75" className="tabular-nums" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="review-sla" className="text-xs text-muted-foreground">
                    Review SLA (hours)
                  </Label>
                  <Input id="review-sla" defaultValue="24" className="tabular-nums" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    </>
  )
}

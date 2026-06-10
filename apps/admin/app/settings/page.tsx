"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader, SectionHeader } from "@/components/admin/page-header"
import { RoleGuard } from "@/components/admin/role-guard"
import { Card, CardContent } from "@zequel/ui/components/card"
import { Button } from "@zequel/ui/components/button"
import { Input } from "@zequel/ui/components/input"
import { Label } from "@zequel/ui/components/label"
import { Switch } from "@zequel/ui/components/switch"
import { Separator } from "@zequel/ui/components/separator"
import { useSystemSettings, saveSettings } from "@/lib/admin-dashboard/api"
import type { SystemSettings } from "@zequel/shared/settings/system-settings"

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
  const { settings: remote, isLoading, error, mutate } = useSystemSettings()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [saving, setSaving] = useState(false)

  // Hydrate local editable copy once the remote settings arrive.
  useEffect(() => {
    if (remote && !settings) setSettings(remote)
  }, [remote, settings])

  const dirty = useMemo(
    () => !!settings && !!remote && JSON.stringify(settings) !== JSON.stringify(remote),
    [settings, remote],
  )

  function set<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    try {
      await saveSettings(settings)
      await mutate()
      toast.success("Settings saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    if (remote) setSettings(remote)
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
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </PageHeader>

      <RoleGuard required="superadmin">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load settings: {error.message}
          </p>
        )}

        {isLoading || !settings ? (
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-0">
                <SectionHeader title="Platform" description="Global availability and access" className="pb-2" />
                <Separator />
                <SettingRow title="Maintenance mode" description="Temporarily disable access for all non-admin users.">
                  <Switch checked={settings.maintenance_mode} onCheckedChange={(v) => set("maintenance_mode", v)} />
                </SettingRow>
                <Separator />
                <SettingRow title="AI enabled" description="Master switch for all AI inference across the platform.">
                  <Switch checked={settings.ai_enabled} onCheckedChange={(v) => set("ai_enabled", v)} />
                </SettingRow>
                <Separator />
                <SettingRow title="File uploads" description="Allow users to upload documents for analysis.">
                  <Switch checked={settings.file_uploads_enabled} onCheckedChange={(v) => set("file_uploads_enabled", v)} />
                </SettingRow>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-0">
                <SectionHeader title="Daily Request Limits" description="Per-user request ceilings by plan" className="pb-2" />
                <Separator />
                <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rl-free" className="text-xs text-muted-foreground">
                      Free (req/day)
                    </Label>
                    <Input
                      id="rl-free"
                      inputMode="numeric"
                      value={settings.free_daily_limit}
                      onChange={(e) => set("free_daily_limit", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rl-lite" className="text-xs text-muted-foreground">
                      Premium Lite (req/day)
                    </Label>
                    <Input
                      id="rl-lite"
                      inputMode="numeric"
                      value={settings.premium_lite_daily_limit}
                      onChange={(e) => set("premium_lite_daily_limit", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rl-pro" className="text-xs text-muted-foreground">
                      Premium Pro (req/day)
                    </Label>
                    <Input
                      id="rl-pro"
                      inputMode="numeric"
                      value={settings.premium_pro_daily_limit}
                      onChange={(e) => set("premium_pro_daily_limit", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-0">
                <SectionHeader title="Rate Limiting" description="Burst protection and throughput" className="pb-2" />
                <Separator />
                <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rpm" className="text-xs text-muted-foreground">
                      Max requests / minute
                    </Label>
                    <Input
                      id="rpm"
                      inputMode="numeric"
                      value={settings.max_requests_per_minute}
                      onChange={(e) => set("max_requests_per_minute", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rph" className="text-xs text-muted-foreground">
                      Max requests / hour
                    </Label>
                    <Input
                      id="rph"
                      inputMode="numeric"
                      value={settings.max_requests_per_hour}
                      onChange={(e) => set("max_requests_per_hour", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-0">
                <SectionHeader title="AI & Models" description="Inference defaults" className="pb-2" />
                <Separator />
                <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="default-model" className="text-xs text-muted-foreground">
                      Default model
                    </Label>
                    <Input
                      id="default-model"
                      value={settings.default_model}
                      onChange={(e) => set("default_model", e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="max-tokens" className="text-xs text-muted-foreground">
                      Max tokens / request
                    </Label>
                    <Input
                      id="max-tokens"
                      inputMode="numeric"
                      value={settings.max_tokens_per_request}
                      onChange={(e) => set("max_tokens_per_request", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-0">
                <SectionHeader title="File Uploads" description="Per-plan upload allowances" className="pb-2" />
                <Separator />
                <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="up-free" className="text-xs text-muted-foreground">
                      Free
                    </Label>
                    <Input
                      id="up-free"
                      inputMode="numeric"
                      value={settings.max_file_uploads_free}
                      onChange={(e) => set("max_file_uploads_free", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="up-lite" className="text-xs text-muted-foreground">
                      Premium Lite
                    </Label>
                    <Input
                      id="up-lite"
                      inputMode="numeric"
                      value={settings.max_file_uploads_premium_lite}
                      onChange={(e) => set("max_file_uploads_premium_lite", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="up-pro" className="text-xs text-muted-foreground">
                      Premium Pro
                    </Label>
                    <Input
                      id="up-pro"
                      inputMode="numeric"
                      value={settings.max_file_uploads_premium_pro}
                      onChange={(e) => set("max_file_uploads_premium_pro", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="max-size" className="text-xs text-muted-foreground">
                      Max size (MB)
                    </Label>
                    <Input
                      id="max-size"
                      inputMode="numeric"
                      value={settings.max_file_size_mb}
                      onChange={(e) => set("max_file_size_mb", Number(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </RoleGuard>
    </>
  )
}

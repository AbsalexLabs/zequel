"use client"

import { Lock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { canAccess } from "@/lib/admin-dashboard/navigation"
import { useAdminSession } from "./admin-session"
import type { AdminRole } from "@/lib/admin-dashboard/types"

// Wraps superadmin-only surfaces. Renders a denied state if the previewing
// role lacks access — mirrors how the server route guards would behave.
export function RoleGuard({ required, children }: { required: AdminRole; children: React.ReactNode }) {
  const { session } = useAdminSession()

  if (!canAccess(session.role, required)) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <Lock className="size-5 text-muted-foreground" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Restricted area</h2>
          <p className="max-w-sm text-pretty text-sm text-muted-foreground">
            This section requires <span className="font-medium text-foreground">{required}</span> privileges. Your
            current role is{" "}
            <span className="font-medium text-foreground">{session.role}</span>.
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Switch role from the account menu to preview
        </p>
      </Card>
    )
  }

  return <>{children}</>
}

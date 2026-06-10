"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ShieldCheck,
  CreditCard,
  Ban,
  RotateCcw,
  Mail,
  FileText,
  MessageSquare,
  Sparkles,
  Calendar,
  Clock,
  Hash,
  Copy,
  Check,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zequel/ui/components/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@zequel/ui/components/avatar"
import { Button } from "@zequel/ui/components/button"
import { Label } from "@zequel/ui/components/label"
import { Input } from "@zequel/ui/components/input"
import { Textarea } from "@zequel/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zequel/ui/components/select"
import { StatusPill } from "@/components/admin/status-pill"
import { formatDate, formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import { useUser } from "@/lib/admin-dashboard/api"
import type { AdminUser, SubscriptionTier } from "@/lib/admin-dashboard/types"

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: "Free",
  premium_lite: "Premium Lite",
  premium_pro: "Premium Pro",
}
const TIERS: SubscriptionTier[] = ["free", "premium_lite", "premium_pro"]
const ROLES: AdminUser["role"][] = ["user", "admin", "superadmin"]
const ROLE_LABEL: Record<AdminUser["role"], string> = {
  user: "User",
  admin: "Admin",
  superadmin: "Superadmin",
}

export interface UserPatch {
  role?: AdminUser["role"]
  status?: AdminUser["status"]
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
}

/**
 * Single modal that opens when an admin clicks a user row. It shows the user's
 * real profile (avatar + activity) and exposes every management action inline,
 * replacing the previous three-dot dropdown.
 */
export function UserDetailDialog({
  user,
  open,
  onOpenChange,
  canManageRoles,
  onPatch,
}: {
  user: AdminUser | null
  open: boolean
  onOpenChange: (v: boolean) => void
  canManageRoles: boolean
  onPatch: (id: string, patch: UserPatch, message: string) => void
}) {
  // Fetch the full profile (real avatar + conversation/document counts) only
  // while the dialog is open for a selected user.
  const { user: detail } = useUser(open && user ? user.id : null)
  const display = detail ?? user

  const [role, setRole] = useState<AdminUser["role"]>("user")
  const [reason, setReason] = useState("")
  const [copied, setCopied] = useState(false)

  // Sync local edit state whenever a new user is opened.
  useEffect(() => {
    if (user) {
      setRole(user.role)
      setReason("")
      setCopied(false)
    }
  }, [user])

  if (!display) return null

  const suspended = display.status === "suspended"
  const roleChanged = role !== display.role

  async function copyId() {
    if (!display) return
    try {
      await navigator.clipboard.writeText(display.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); fail silently.
    }
  }

  const stats = [
    { label: "AI Requests", value: formatNumber(display.aiRequests), icon: Sparkles },
    { label: "Conversations", value: formatNumber(display.conversations), icon: MessageSquare },
    { label: "Documents", value: formatNumber(display.documents), icon: FileText },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User profile</DialogTitle>
          <DialogDescription>Account overview, activity, and management.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto overscroll-contain py-1 pr-1">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <Avatar className="size-12 shrink-0">
              {display.avatarUrl ? <AvatarImage src={display.avatarUrl} alt={display.name} /> : null}
              <AvatarFallback className="bg-secondary font-mono text-sm font-semibold text-foreground">
                {initials(display.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{display.name}</p>
              <p className="truncate text-xs text-muted-foreground">{display.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={display.status} />
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              <CreditCard className="size-3" />
              {TIER_LABEL[display.tier]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground">
              <ShieldCheck className="size-3" />
              {ROLE_LABEL[display.role]}
            </span>
          </div>

          {/* Activity */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <Icon className="size-4 text-muted-foreground" />
                  <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              )
            })}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="size-3.5" />
                User ID
              </dt>
              <dd className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-foreground">{display.id}</span>
                <button
                  type="button"
                  onClick={copyId}
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Copy user ID"
                >
                  {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                </button>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3.5" />
                Joined
              </dt>
              <dd className="text-foreground">{formatDate(display.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" />
                Last active
              </dt>
              <dd className="text-foreground">{relativeTime(display.lastActiveAt)}</dd>
            </div>
          </dl>

          {/* Management */}
          <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Manage
            </p>

            <div className="space-y-2">
              <Label htmlFor="role-select" className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                Role
              </Label>
              <div className="flex gap-2">
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as AdminUser["role"])}
                  disabled={!canManageRoles}
                >
                  <SelectTrigger id="role-select" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="h-9 shrink-0"
                  disabled={!canManageRoles || !roleChanged}
                  onClick={() => onPatch(display.id, { role }, `${display.name} is now ${ROLE_LABEL[role]}`)}
                >
                  Save
                </Button>
              </div>
              {!canManageRoles && (
                <p className="text-xs text-muted-foreground">Superadmin role required to change roles.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="suspend-reason" className="flex items-center gap-1.5">
                {suspended ? <RotateCcw className="size-3.5" /> : <Ban className="size-3.5" />}
                {suspended ? "Reactivate access" : "Suspend access"}
              </Label>
              {!suspended && (
                <Textarea
                  id="suspend-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (recorded in the audit log)"
                  className="min-h-[60px] resize-none text-sm"
                />
              )}
              {suspended ? (
                <Button
                  variant="outline"
                  className="h-9 w-full"
                  onClick={() => onPatch(display.id, { status: "active" }, `${display.name} reactivated`)}
                >
                  <RotateCcw className="size-4" />
                  Reactivate user
                </Button>
              ) : (
                <Button
                  className="h-9 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onPatch(display.id, { status: "suspended" }, `${display.name} suspended`)}
                >
                  <Ban className="size-4" />
                  Suspend user
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function InviteUserDialog({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onInvite: (user: AdminUser, message: string) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AdminUser["role"]>("user")
  const [tier, setTier] = useState<SubscriptionTier>("free")

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email])
  const valid = name.trim().length > 1 && emailValid

  function reset() {
    setName("")
    setEmail("")
    setRole("user")
    setTier("free")
  }

  function send() {
    const now = new Date().toISOString()
    const newUser: AdminUser = {
      id: `usr_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatarUrl: null,
      role,
      tier,
      status: "invited",
      createdAt: now,
      lastActiveAt: now,
      conversations: 0,
      documents: 0,
      aiRequests: 0,
    }
    onInvite(newUser, `Invite sent to ${newUser.email}`)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            Invite user
          </DialogTitle>
          <DialogDescription>Send an invitation to join the platform.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Full name</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
            {email.length > 0 && !emailValid && (
              <p className="text-xs text-destructive">Enter a valid email address.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AdminUser["role"])}>
                <SelectTrigger id="invite-role" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-tier">Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as SubscriptionTier)}>
                <SelectTrigger id="invite-tier" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIER_LABEL[t]}
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
          <Button onClick={send} disabled={!valid}>
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

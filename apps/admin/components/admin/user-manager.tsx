"use client"

import { useMemo, useState } from "react"
import {
  User,
  ShieldCheck,
  CreditCard,
  Ban,
  RotateCcw,
  Mail,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zequel/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zequel/ui/components/dropdown-menu"
import { Button } from "@zequel/ui/components/button"
import { Label } from "@zequel/ui/components/label"
import { Input } from "@zequel/ui/components/input"
import { Textarea } from "@zequel/ui/components/textarea"
import { MoreHorizontal } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zequel/ui/components/select"
import { StatusPill } from "@/components/admin/status-pill"
import { formatDate, formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
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
  tier?: SubscriptionTier
  status?: AdminUser["status"]
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
}

type DialogKind = "profile" | "role" | "tier" | "suspend" | null

export function UserRowActions({
  user,
  canManageRoles,
  onPatch,
}: {
  user: AdminUser
  canManageRoles: boolean
  onPatch: (id: string, patch: UserPatch, message: string) => void
}) {
  const [dialog, setDialog] = useState<DialogKind>(null)
  const close = () => setDialog(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="User actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("profile")}>View profile</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("role")} disabled={!canManageRoles}>
            Edit role
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("tier")}>Change tier</DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.status === "suspended" ? (
            <DropdownMenuItem onSelect={() => setDialog("suspend")}>Reactivate</DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-destructive" onSelect={() => setDialog("suspend")}>
              Suspend
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={dialog === "profile"} onClose={close} user={user} />
      <RoleDialog open={dialog === "role"} onClose={close} user={user} onPatch={onPatch} />
      <TierDialog open={dialog === "tier"} onClose={close} user={user} onPatch={onPatch} />
      <SuspendDialog open={dialog === "suspend"} onClose={close} user={user} onPatch={onPatch} />
    </>
  )
}

function ProfileDialog({
  open,
  onClose,
  user,
}: {
  open: boolean
  onClose: () => void
  user: AdminUser
}) {
  const stats = [
    { label: "AI Requests", value: formatNumber(user.aiRequests), icon: Sparkles },
    { label: "Conversations", value: formatNumber(user.conversations), icon: MessageSquare },
    { label: "Documents", value: formatNumber(user.documents), icon: FileText },
  ]
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User profile</DialogTitle>
          <DialogDescription>Account overview and activity.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-sm font-semibold text-foreground">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={user.status} />
            <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {TIER_LABEL[user.tier]}
            </span>
            <span className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground">
              {ROLE_LABEL[user.role]}
            </span>
          </div>

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
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="font-mono text-xs text-foreground">{user.id}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Joined</dt>
              <dd className="text-foreground">{formatDate(user.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Last active</dt>
              <dd className="text-foreground">{relativeTime(user.lastActiveAt)}</dd>
            </div>
          </dl>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RoleDialog({
  open,
  onClose,
  user,
  onPatch,
}: {
  open: boolean
  onClose: () => void
  user: AdminUser
  onPatch: (id: string, patch: UserPatch, message: string) => void
}) {
  const [role, setRole] = useState<AdminUser["role"]>(user.role)
  const changed = role !== user.role

  function save() {
    onPatch(user.id, { role }, `${user.name} is now ${ROLE_LABEL[role]}`)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
        else setRole(user.role)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Edit role
          </DialogTitle>
          <DialogDescription>
            {user.name} · {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="role-select">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as AdminUser["role"])}>
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
          <p className="text-xs text-muted-foreground">
            {role === "superadmin"
              ? "Full access including role management and revocations."
              : role === "admin"
                ? "Can manage users, content, and subscriptions."
                : "Standard platform access only."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!changed}>
            Save role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TierDialog({
  open,
  onClose,
  user,
  onPatch,
}: {
  open: boolean
  onClose: () => void
  user: AdminUser
  onPatch: (id: string, patch: UserPatch, message: string) => void
}) {
  const [tier, setTier] = useState<SubscriptionTier>(user.tier)
  const changed = tier !== user.tier

  function save() {
    onPatch(user.id, { tier }, `${user.name} moved to ${TIER_LABEL[tier]}`)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
        else setTier(user.tier)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Change tier
          </DialogTitle>
          <DialogDescription>
            {user.name} · {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
            <div>
              <p className="text-xs text-muted-foreground">Current tier</p>
              <p className="text-sm font-medium text-foreground">{TIER_LABEL[user.tier]}</p>
            </div>
            <StatusPill status={user.status} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier-select">Assign tier</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as SubscriptionTier)}>
              <SelectTrigger id="tier-select" className="h-9">
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!changed}>
            Save tier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SuspendDialog({
  open,
  onClose,
  user,
  onPatch,
}: {
  open: boolean
  onClose: () => void
  user: AdminUser
  onPatch: (id: string, patch: UserPatch, message: string) => void
}) {
  const reactivating = user.status === "suspended"
  const [reason, setReason] = useState("")

  function confirm() {
    if (reactivating) {
      onPatch(user.id, { status: "active" }, `${user.name} reactivated`)
    } else {
      onPatch(user.id, { status: "suspended" }, `${user.name} suspended`)
    }
    setReason("")
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setReason("")
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {reactivating ? <RotateCcw className="size-4" /> : <Ban className="size-4 text-destructive" />}
            {reactivating ? "Reactivate user" : "Suspend user"}
          </DialogTitle>
          <DialogDescription>
            {reactivating
              ? `Restore access for ${user.name}.`
              : `Revoke platform access for ${user.name}. They will be signed out.`}
          </DialogDescription>
        </DialogHeader>

        {!reactivating && (
          <div className="space-y-2 py-1">
            <Label htmlFor="suspend-reason">
              Reason <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Recorded in the audit log"
              className="min-h-[64px] resize-none text-sm"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {reactivating ? (
            <Button onClick={confirm}>Reactivate</Button>
          ) : (
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirm}
            >
              Suspend
            </Button>
          )}
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

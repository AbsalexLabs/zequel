import type { AdminRole } from "./types"

export interface NavItem {
  label: string
  href: string
  icon: string
  // Minimum role required to see this nav item.
  minRole: AdminRole
  description: string
}

// Single source of truth for the sidebar + RBAC. "admin" can see everything
// except superadmin-only operational surfaces (System Settings, Audit Logs).
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: "LayoutDashboard",
    minRole: "admin",
    description: "Platform health and key metrics",
  },
  {
    label: "Users",
    href: "/users",
    icon: "Users",
    minRole: "admin",
    description: "Accounts, roles, and access",
  },
  {
    label: "Subscriptions",
    href: "/subscriptions",
    icon: "CreditCard",
    minRole: "admin",
    description: "Plans, billing, and revenue",
  },
  {
    label: "AI Usage",
    href: "/ai-usage",
    icon: "Cpu",
    minRole: "admin",
    description: "Model requests, tokens, and cost",
  },
  {
    label: "Conversations",
    href: "/conversations",
    icon: "MessagesSquare",
    minRole: "admin",
    description: "Research sessions and threads",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: "FileText",
    minRole: "admin",
    description: "Indexed corpus and ingestion",
  },
  {
    label: "Safety Center",
    href: "/safety",
    icon: "ShieldAlert",
    minRole: "admin",
    description: "Moderation and risk signals",
  },
  {
    label: "Support",
    href: "/support",
    icon: "LifeBuoy",
    minRole: "admin",
    description: "Tickets and user reports",
  },
  {
    label: "Website CMS",
    href: "/cms",
    icon: "Globe",
    minRole: "admin",
    description: "Manage public site content",
  },
  {
    label: "Audit Logs",
    href: "/audit",
    icon: "ScrollText",
    minRole: "superadmin",
    description: "Privileged action history",
  },
  {
    label: "System Settings",
    href: "/settings",
    icon: "Settings2",
    minRole: "superadmin",
    description: "Limits, features, and config",
  },
]

const ROLE_RANK: Record<AdminRole, number> = {
  admin: 1,
  superadmin: 2,
}

export function canAccess(role: AdminRole, required: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required]
}

export function visibleNavItems(role: AdminRole): NavItem[] {
  return NAV_ITEMS.filter((item) => canAccess(role, item.minRole))
}

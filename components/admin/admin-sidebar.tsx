"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Cpu,
  MessagesSquare,
  FileText,
  ShieldAlert,
  LifeBuoy,
  ScrollText,
  Settings2,
  Globe,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { visibleNavItems } from "@/lib/admin-dashboard/navigation"
import { useAdminSession } from "./admin-session"

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  CreditCard,
  Cpu,
  MessagesSquare,
  FileText,
  ShieldAlert,
  LifeBuoy,
  ScrollText,
  Settings2,
  Globe,
}

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { session } = useAdminSession()
  const items = visibleNavItems(session.role)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex flex-col">
          <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Zequel</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Control Center
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
                  <span className="truncate">{item.label}</span>
                  {item.minRole === "superadmin" ? (
                    <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      SU
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-md bg-secondary/60 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">System status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-foreground" aria-hidden />
            <span className="text-xs font-medium text-foreground">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  )
}

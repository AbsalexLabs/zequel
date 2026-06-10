"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Files,
  PanelTop,
  Sparkles,
  Tags,
  BookOpen,
  Newspaper,
  GitCommitVertical,
  HelpCircle,
  Mail,
  Lightbulb,
  Bug,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CMS_NAV } from "@/lib/admin-dashboard/cms-nav"

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Files,
  PanelTop,
  Sparkles,
  Tags,
  BookOpen,
  Newspaper,
  GitCommitVertical,
  HelpCircle,
  Mail,
  Lightbulb,
  Bug,
  Image: ImageIcon,
}

export function CmsSubnav() {
  const pathname = usePathname()

  return (
    <nav className="-mx-4 overflow-x-auto border-b border-border px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <ul className="flex min-w-max items-center gap-1 pb-px">
        {CMS_NAV.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard
          const active =
            item.href === "/admin/cms" ? pathname === "/admin/cms" : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors",
                  active
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

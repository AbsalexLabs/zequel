import {
  FileSearch,
  GitBranch,
  ShieldCheck,
  Layers,
  Quote,
  Gauge,
  Users,
  Database,
  Bell,
  BookOpen,
  Plug,
  Shield,
  Terminal,
  Rocket,
  Code,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

/**
 * Maps the string icon names stored in the CMS (cms_feature_items.icon, etc.)
 * to their Lucide component. Falls back to a neutral icon for unknown names so
 * the public site never crashes on unexpected data.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  FileSearch,
  GitBranch,
  ShieldCheck,
  Layers,
  Quote,
  Gauge,
  Users,
  Database,
  Bell,
  BookOpen,
  Plug,
  Shield,
  Terminal,
  Rocket,
  Code,
  Sparkles,
}

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (name && ICON_MAP[name]) return ICON_MAP[name]
  return Sparkles
}

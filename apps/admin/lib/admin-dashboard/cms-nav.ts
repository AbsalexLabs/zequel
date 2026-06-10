// Sub-navigation for the Website CMS module. Drives the horizontal tab bar
// rendered inside the CMS layout.

export interface CmsNavItem {
  label: string
  href: string
  icon: string
  group: "Content" | "Inbox" | "Assets" | "Overview"
}

export const CMS_NAV: CmsNavItem[] = [
  { label: "Overview", href: "/admin/cms", icon: "LayoutDashboard", group: "Overview" },
  { label: "Pages", href: "/admin/cms/pages", icon: "Files", group: "Content" },
  { label: "Hero Sections", href: "/admin/cms/hero", icon: "PanelTop", group: "Content" },
  { label: "Features", href: "/admin/cms/features", icon: "Sparkles", group: "Content" },
  { label: "Pricing", href: "/admin/cms/pricing", icon: "Tags", group: "Content" },
  { label: "Documentation", href: "/admin/cms/docs", icon: "BookOpen", group: "Content" },
  { label: "Blog", href: "/admin/cms/blog", icon: "Newspaper", group: "Content" },
  { label: "Changelog", href: "/admin/cms/changelog", icon: "GitCommitVertical", group: "Content" },
  { label: "FAQ", href: "/admin/cms/faq", icon: "HelpCircle", group: "Content" },
  { label: "Contact Messages", href: "/admin/cms/contact", icon: "Mail", group: "Inbox" },
  { label: "Feature Requests", href: "/admin/cms/feature-requests", icon: "Lightbulb", group: "Inbox" },
  { label: "Bug Reports", href: "/admin/cms/bug-reports", icon: "Bug", group: "Inbox" },
  { label: "Media Library", href: "/admin/cms/media", icon: "Image", group: "Assets" },
]

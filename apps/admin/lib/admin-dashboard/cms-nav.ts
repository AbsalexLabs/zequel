// Sub-navigation for the Website CMS module. Drives the horizontal tab bar
// rendered inside the CMS layout.

export interface CmsNavItem {
  label: string
  href: string
  icon: string
  group: "Content" | "Inbox" | "Assets" | "Overview"
}

export const CMS_NAV: CmsNavItem[] = [
  { label: "Overview", href: "/cms", icon: "LayoutDashboard", group: "Overview" },
  { label: "Pages", href: "/cms/pages", icon: "Files", group: "Content" },
  { label: "Hero Sections", href: "/cms/hero", icon: "PanelTop", group: "Content" },
  { label: "Features", href: "/cms/features", icon: "Sparkles", group: "Content" },
  { label: "Pricing", href: "/cms/pricing", icon: "Tags", group: "Content" },
  { label: "Documentation", href: "/cms/docs", icon: "BookOpen", group: "Content" },
  { label: "Blog", href: "/cms/blog", icon: "Newspaper", group: "Content" },
  { label: "Changelog", href: "/cms/changelog", icon: "GitCommitVertical", group: "Content" },
  { label: "FAQ", href: "/cms/faq", icon: "HelpCircle", group: "Content" },
  { label: "Contact Messages", href: "/cms/contact", icon: "Mail", group: "Inbox" },
  { label: "Feature Requests", href: "/cms/feature-requests", icon: "Lightbulb", group: "Inbox" },
  { label: "Bug Reports", href: "/cms/bug-reports", icon: "Bug", group: "Inbox" },
  { label: "Media Library", href: "/cms/media", icon: "Image", group: "Assets" },
]

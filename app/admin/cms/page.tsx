"use client"

import Link from "next/link"
import {
  Files,
  Newspaper,
  Mail,
  Lightbulb,
  Bug,
  Image as ImageIcon,
  ArrowUpRight,
  BookOpen,
  HelpCircle,
  Tags,
  Sparkles,
  GitCommitVertical,
} from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import { useCmsList } from "@/lib/admin-dashboard/cms-api"
import type {
  BlogPost,
  BugReport,
  CmsPage,
  ContactMessage,
  DocArticle,
  FaqItem,
  FeatureItem,
  FeatureRequest,
  MediaAsset,
  PricingPlan,
  ChangelogEntry,
} from "@/lib/admin-dashboard/cms-types"

export default function CmsOverviewPage() {
  const { items: cmsPages } = useCmsList<CmsPage>("pages")
  const { items: featureItems } = useCmsList<FeatureItem>("features")
  const { items: pricingPlans } = useCmsList<PricingPlan>("pricing")
  const { items: docArticles } = useCmsList<DocArticle>("docs")
  const { items: blogPosts } = useCmsList<BlogPost>("blog")
  const { items: faqItems } = useCmsList<FaqItem>("faq")
  const { items: mediaAssets } = useCmsList<MediaAsset>("media")
  const { items: changelog } = useCmsList<ChangelogEntry>("changelog")
  const { items: contactMessages } = useCmsList<ContactMessage>("contact")
  const { items: featureRequests } = useCmsList<FeatureRequest>("feature-requests")
  const { items: bugReports } = useCmsList<BugReport>("bug-reports")

  const QUICK_LINKS = [
    { label: "Pages", href: "/admin/cms/pages", icon: Files, count: cmsPages.length },
    { label: "Features", href: "/admin/cms/features", icon: Sparkles, count: featureItems.length },
    { label: "Pricing", href: "/admin/cms/pricing", icon: Tags, count: pricingPlans.length },
    { label: "Documentation", href: "/admin/cms/docs", icon: BookOpen, count: docArticles.length },
    { label: "Blog", href: "/admin/cms/blog", icon: Newspaper, count: blogPosts.length },
    { label: "FAQ", href: "/admin/cms/faq", icon: HelpCircle, count: faqItems.length },
    { label: "Media Library", href: "/admin/cms/media", icon: ImageIcon, count: mediaAssets.length },
    { label: "Changelog", href: "/admin/cms/changelog", icon: GitCommitVertical, count: changelog.length },
  ]

  const newMessages = contactMessages.filter((m) => m.status === "new").length
  const openRequests = featureRequests.filter((r) => r.status === "open").length
  const openBugs = bugReports.filter((b) => b.status !== "resolved" && b.status !== "wont_fix").length
  const published = cmsPages.filter((p) => p.status === "published").length

  const recent = [...cmsPages]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  return (
    <>
      <PageHeader
        title="Website CMS"
        description="Manage every section of the public Zequel website. Edits publish to the live site instantly."
      >
        <Button size="sm" variant="outline" asChild>
          <a href="/" target="_blank" rel="noreferrer">
            <ArrowUpRight className="size-4" /> View live site
          </a>
        </Button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Published Pages" value={`${published}/${cmsPages.length}`} />
        <StatCard label="New Messages" value={formatNumber(newMessages)} />
        <StatCard label="Open Requests" value={formatNumber(openRequests)} />
        <StatCard label="Open Bugs" value={formatNumber(openBugs)} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Content sections
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <Card className="group flex h-full flex-col justify-between gap-4 p-4 transition-colors hover:border-foreground/30">
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
                        <Icon className="size-4 text-foreground" />
                      </span>
                      <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{link.label}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{link.count} items</p>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Recently updated
          </h2>
          <Card className="divide-y divide-border p-0">
            {recent.map((page) => (
              <Link
                key={page.id}
                href="/admin/cms/pages"
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{page.title}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{page.slug}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <CmsStatusPill status={page.status} />
                  <span className="text-[11px] text-muted-foreground">{relativeTime(page.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Inbox</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <InboxStat label="Messages" value={newMessages} href="/admin/cms/contact" icon={Mail} />
              <InboxStat label="Requests" value={openRequests} href="/admin/cms/feature-requests" icon={Lightbulb} />
              <InboxStat label="Bugs" value={openBugs} href="/admin/cms/bug-reports" icon={Bug} />
            </div>
          </Card>
        </div>
      </section>
    </>
  )
}

function InboxStat({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string
  value: number
  href: string
  icon: typeof Mail
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 rounded-md border border-border bg-secondary/30 py-3 transition-colors hover:border-foreground/30"
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-lg font-semibold tabular-nums text-foreground">{value}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </Link>
  )
}

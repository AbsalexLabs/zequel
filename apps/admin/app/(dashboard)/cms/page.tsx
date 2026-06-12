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
import { Card } from "@zequel/ui/components/card"
import { Button } from "@zequel/ui/components/button"
import { CmsStatusPill } from "@/components/admin/cms/cms-status-pill"
import { formatNumber, relativeTime } from "@/lib/admin-dashboard/format"
import { useCmsList } from "@/lib/admin-dashboard/cms-api"
import type {
  CmsPage,
  FeatureItem,
  PricingPlan,
  DocArticle,
  BlogPost,
  FaqItem,
  MediaAsset,
  ContactMessage,
  FeatureRequest,
  CmsBugReport,
} from "@zequel/types"

export default function CmsOverviewPage() {
  const pages = useCmsList<CmsPage>("pages")
  const features = useCmsList<FeatureItem>("features")
  const pricing = useCmsList<PricingPlan>("pricing")
  const docs = useCmsList<DocArticle>("docs")
  const blog = useCmsList<BlogPost>("blog")
  const faq = useCmsList<FaqItem>("faq")
  const media = useCmsList<MediaAsset>("media")
  const changelog = useCmsList<{ id: string }>("changelog")
  const contact = useCmsList<ContactMessage>("contact")
  const requests = useCmsList<FeatureRequest>("feature-requests")
  const bugs = useCmsList<CmsBugReport>("bug-reports")

  const quickLinks = [
    { label: "Pages", href: "/cms/pages", icon: Files, count: pages.total },
    { label: "Features", href: "/cms/features", icon: Sparkles, count: features.total },
    { label: "Pricing", href: "/cms/pricing", icon: Tags, count: pricing.total },
    { label: "Documentation", href: "/cms/docs", icon: BookOpen, count: docs.total },
    { label: "Blog", href: "/cms/blog", icon: Newspaper, count: blog.total },
    { label: "FAQ", href: "/cms/faq", icon: HelpCircle, count: faq.total },
    { label: "Media Library", href: "/cms/media", icon: ImageIcon, count: media.total },
    { label: "Changelog", href: "/cms/changelog", icon: GitCommitVertical, count: changelog.total },
  ]

  const newMessages = contact.items.filter((m) => m.status === "new").length
  const openRequests = requests.items.filter((r) => r.status === "open").length
  const openBugs = bugs.items.filter((b) => b.status !== "resolved" && b.status !== "wont_fix").length
  const published = pages.items.filter((p) => p.status === "published").length

  const recent = [...pages.items]
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
        <StatCard label="Published Pages" value={`${published}/${pages.total}`} />
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
            {quickLinks.map((link) => {
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
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                {pages.isLoading ? "Loading…" : "No pages yet."}
              </p>
            ) : (
              recent.map((page) => (
                <Link
                  key={page.id}
                  href="/cms/pages"
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
              ))
            )}
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Inbox</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <InboxStat label="Messages" value={newMessages} href="/cms/contact" icon={Mail} />
              <InboxStat label="Requests" value={openRequests} href="/cms/feature-requests" icon={Lightbulb} />
              <InboxStat label="Bugs" value={openBugs} href="/cms/bug-reports" icon={Bug} />
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

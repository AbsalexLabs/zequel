import Link from "next/link"
import { PageHero } from "@/components/site/page-hero"
import { SectionLabel } from "@/components/site/section-label"
import { ArrowRight, Search } from "lucide-react"
import { getDocArticles } from "@/lib/site/content"
import { DOCS_FALLBACK, DOC_CATEGORY_ICONS } from "@/lib/site/fallbacks"
import { resolveIcon } from "@/lib/site/icons"

export const revalidate = 60


// Short blurb shown under each documentation category heading.
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Getting started": "Set up your first workspace and run an evidence-backed query in minutes.",
  "Research workflow": "How sources, citations, and answers move through Zequel.",
  Integrations: "Connect Zequel to the tools your team already uses.",
  "API reference": "Programmatic access to research, sessions, and exports.",
  "Security & trust": "How we handle data, access, and compliance.",
  "Admin & teams": "Manage members, roles, billing, and usage at scale.",
}

export default async function DocsPage() {
  const articles = await getDocArticles(DOCS_FALLBACK)

  // Group articles by category, preserving first-seen order.
  const order: string[] = []
  const grouped = new Map<string, { title: string; slug: string }[]>()
  for (const a of articles) {
    const cat = a.category || "General"
    if (!grouped.has(cat)) {
      grouped.set(cat, [])
      order.push(cat)
    }
    grouped.get(cat)!.push({ title: a.title, slug: a.slug })
  }
  const sections = order.map((title) => ({
    title,
    icon: DOC_CATEGORY_ICONS[title] || "BookOpen",
    description: CATEGORY_DESCRIPTIONS[title] || "",
    links: grouped.get(title)!,
  }))

  return (
    <>
      <PageHero
        label="Documentation"
        title="Everything you need to build with Zequel"
        description="Guides, references, and concepts for getting the most out of evidence-first research. Start with the quickstart or jump to a topic."
      />

      {/* Search bar */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center gap-3 rounded-md border border-border bg-background px-4 text-muted-foreground">
            <Search size={16} strokeWidth={1.5} />
            <span className="text-sm">Search the docs...</span>
            <span className="ml-auto hidden font-mono text-[11px] uppercase tracking-wider sm:inline">⌘ K</span>
          </div>
        </div>
      </section>

      {/* Sections grid */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionLabel>Browse by topic</SectionLabel>
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => {
              const Icon = resolveIcon(s.icon)
              return (
                <div key={s.title} className="flex flex-col bg-background p-7">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border">
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-5 text-lg font-medium tracking-[-0.01em]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                  <ul className="mt-5 flex flex-col gap-px border-t border-border pt-4">
                    {s.links.map((l) => (
                      <li key={l.slug}>
                        <Link
                          href={`/docs/${l.slug}`}
                          className="group flex items-center justify-between py-2 text-sm text-foreground/80 transition-colors hover:text-foreground"
                        >
                          {l.title}
                          <ArrowRight
                            size={13}
                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Help footer */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-border bg-muted/40 p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-medium tracking-[-0.01em]">Can&apos;t find what you need?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Reach out to the team and we&apos;ll point you in the right direction.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-foreground px-6 font-mono text-xs uppercase tracking-wider text-background transition-opacity hover:opacity-90"
          >
            Contact support
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  )
}

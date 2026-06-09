import Link from "next/link"
import { PageHero } from "@/components/site/page-hero"
import { SectionLabel } from "@/components/site/section-label"
import { CtaSection } from "@/components/site/cta-section"
import { ArrowRight } from "lucide-react"

const featured = {
  category: "Product",
  date: "Mar 2026",
  readTime: "6 min",
  title: "Why every claim in your research should carry its own evidence",
  excerpt:
    "We rebuilt the research workflow around a simple rule: nothing ships without a source. Here's how citation-first thinking changes the way teams work.",
}

const posts = [
  {
    category: "Engineering",
    date: "Mar 2026",
    readTime: "8 min",
    title: "Designing a retrieval layer that researchers actually trust",
  },
  {
    category: "Research",
    date: "Feb 2026",
    readTime: "5 min",
    title: "Measuring hallucination: how we score every generated answer",
  },
  {
    category: "Company",
    date: "Feb 2026",
    readTime: "4 min",
    title: "Building Zequel as a remote-first, evidence-first team",
  },
  {
    category: "Product",
    date: "Jan 2026",
    readTime: "7 min",
    title: "From prompt to provenance: the anatomy of a Zequel session",
  },
  {
    category: "Guides",
    date: "Jan 2026",
    readTime: "9 min",
    title: "A practical workflow for literature reviews that hold up",
  },
  {
    category: "Engineering",
    date: "Dec 2025",
    readTime: "6 min",
    title: "Streaming structured answers without losing the citations",
  },
]

export default function BlogPage() {
  return (
    <>
      <PageHero
        label="Blog"
        title="Notes on evidence, research, and the product"
        description="Deep dives, engineering notes, and thinking on how AI research should work when accuracy is the whole point."
      />

      {/* Featured */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionLabel>Featured</SectionLabel>
          <Link
            href="/site/blog"
            className="group mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2"
          >
            <div className="flex flex-col justify-between bg-background p-8 md:p-10">
              <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <span className="text-foreground">{featured.category}</span>
                <span aria-hidden>/</span>
                <span>{featured.date}</span>
                <span aria-hidden>/</span>
                <span>{featured.readTime}</span>
              </div>
              <h2 className="mt-6 text-balance text-2xl font-semibold leading-snug tracking-[-0.02em] sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{featured.excerpt}</p>
              <span className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-foreground">
                Read article
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
            <div className="relative min-h-[260px] bg-muted/40">
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.5]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Zequel Journal
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Grid */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionLabel>Latest</SectionLabel>
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.title}
                href="/site/blog"
                className="group flex flex-col gap-4 bg-background p-7 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span className="text-foreground">{p.category}</span>
                  <span aria-hidden>/</span>
                  <span>{p.date}</span>
                </div>
                <h3 className="text-pretty text-lg font-medium leading-snug tracking-[-0.01em]">{p.title}</h3>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {p.readTime}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  )
}

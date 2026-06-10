import Link from "next/link"
import { PageHero } from "@/components/site/page-hero"
import { SectionLabel } from "@/components/site/section-label"
import { CtaSection } from "@/components/site/cta-section"
import { ArrowRight } from "lucide-react"
import { getBlogPosts, type BlogPostContent } from "@/lib/site/content"
import { BLOG_FALLBACK } from "@/lib/site/fallbacks"

export const revalidate = 60


function formatDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

function category(post: BlogPostContent): string {
  return post.tags[0] || post.author || "Article"
}

// Rough reading time from the excerpt length as a stable, content-derived value.
function readTime(post: BlogPostContent): string {
  const words = post.excerpt.trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(3, Math.round(words / 40))} min`
}

export default async function BlogPage() {
  const posts = await getBlogPosts(BLOG_FALLBACK)
  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <>
      <PageHero
        label="Blog"
        title="Notes on evidence, research, and the product"
        description="Deep dives, engineering notes, and thinking on how AI research should work when accuracy is the whole point."
      />

      {/* Featured */}
      {featured && (
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <SectionLabel>Featured</SectionLabel>
            <Link
              href={`/site/blog/${featured.slug}`}
              className="group mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2"
            >
              <div className="flex flex-col justify-between bg-background p-8 md:p-10">
                <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  <span className="text-foreground">{category(featured)}</span>
                  <span aria-hidden>/</span>
                  <span>{formatDate(featured.publishedAt)}</span>
                  <span aria-hidden>/</span>
                  <span>{readTime(featured)}</span>
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
      )}

      {/* Grid */}
      {rest.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <SectionLabel>Latest</SectionLabel>
            <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link
                  key={p.slug}
                  href={`/site/blog/${p.slug}`}
                  className="group flex flex-col gap-4 bg-background p-7 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span className="text-foreground">{category(p)}</span>
                    <span aria-hidden>/</span>
                    <span>{formatDate(p.publishedAt)}</span>
                  </div>
                  <h3 className="text-pretty text-lg font-medium leading-snug tracking-[-0.01em]">{p.title}</h3>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {readTime(p)}
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
      )}

      <CtaSection />
    </>
  )
}

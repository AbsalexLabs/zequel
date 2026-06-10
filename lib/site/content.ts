import "server-only"
import { canCreateServiceClient, createServiceClient } from "@/lib/supabase/service"
import {
  CMS_RESOURCES,
  cmsRowToModel,
  cmsSelectColumns,
  type CmsModel,
} from "@/lib/admin-dashboard/cms-schema"

// ---------------------------------------------------------------------------
// Public site content layer.
//
// Reads *published* CMS rows from Supabase (via the service client) for the
// marketing site. Every reader accepts a `fallback` so the public site keeps
// rendering sensible copy when the database is empty or unreachable — this is
// important here because the database lives in a separate account and may not
// be seeded yet.
// ---------------------------------------------------------------------------

// Cache published content briefly so the marketing pages stay fast and don't
// hammer the database on every request.
export const revalidate = 60

type ResourceKey = keyof typeof CMS_RESOURCES

async function readPublished(resource: ResourceKey): Promise<CmsModel[] | null> {
  if (!canCreateServiceClient()) return null

  const config = CMS_RESOURCES[resource]
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from(config.table)
      .select(cmsSelectColumns(config))
      .eq("status", "published")
      .order(config.orderBy.col, { ascending: config.orderBy.ascending })

    if (error) {
      console.log("[v0] site content read error:", resource, error.message)
      return null
    }
    return (data || []).map((row) => cmsRowToModel(config, row as Record<string, unknown>))
  } catch (err) {
    console.log("[v0] site content read threw:", resource, (err as Error).message)
    return null
  }
}

/** Returns published rows, or the provided fallback when none exist. */
async function withFallback<T>(
  resource: ResourceKey,
  map: (rows: CmsModel[]) => T[],
  fallback: T[],
): Promise<T[]> {
  const rows = await readPublished(resource)
  if (!rows || rows.length === 0) return fallback
  const mapped = map(rows)
  return mapped.length > 0 ? mapped : fallback
}

// --- Typed content models --------------------------------------------------

export interface HeroContent {
  eyebrow: string
  headline: string
  subhead: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
}

export interface FeatureContent {
  title: string
  description: string
  icon: string
  group: string
}

export interface PricingPlanContent {
  name: string
  priceMonthly: number
  priceYearly: number
  description: string
  features: string[]
  highlighted: boolean
  ctaLabel: string
}

export interface FaqContent {
  question: string
  answer: string
  category: string
}

export interface BlogPostContent {
  title: string
  slug: string
  excerpt: string
  author: string
  tags: string[]
  publishedAt: string | null
  views: number
}

export interface DocArticleContent {
  title: string
  slug: string
  category: string
  readingMinutes: number
}

// --- Readers (one per site section) ----------------------------------------

export async function getHero(page: string, fallback: HeroContent): Promise<HeroContent> {
  const rows = await readPublished("hero")
  const match = rows?.find((r) => r.page === page)
  if (!match) return fallback
  return {
    eyebrow: (match.eyebrow as string) || fallback.eyebrow,
    headline: (match.headline as string) || fallback.headline,
    subhead: (match.subhead as string) || fallback.subhead,
    primaryCtaLabel: (match.primaryCtaLabel as string) || fallback.primaryCtaLabel,
    primaryCtaHref: (match.primaryCtaHref as string) || fallback.primaryCtaHref,
    secondaryCtaLabel: (match.secondaryCtaLabel as string) || fallback.secondaryCtaLabel,
    secondaryCtaHref: (match.secondaryCtaHref as string) || fallback.secondaryCtaHref,
  }
}

export function getFeatures(fallback: FeatureContent[]): Promise<FeatureContent[]> {
  return withFallback(
    "features",
    (rows) =>
      rows.map((r) => ({
        title: (r.title as string) || "",
        description: (r.description as string) || "",
        icon: (r.icon as string) || "",
        group: (r.group as string) || "",
      })),
    fallback,
  )
}

export function getPricingPlans(fallback: PricingPlanContent[]): Promise<PricingPlanContent[]> {
  return withFallback(
    "pricing",
    (rows) =>
      rows.map((r) => ({
        name: (r.name as string) || "",
        priceMonthly: Number(r.priceMonthly) || 0,
        priceYearly: Number(r.priceYearly) || 0,
        description: (r.description as string) || "",
        features: Array.isArray(r.features) ? (r.features as string[]) : [],
        highlighted: Boolean(r.highlighted),
        ctaLabel: (r.ctaLabel as string) || "Get started",
      })),
    fallback,
  )
}

export function getFaq(fallback: FaqContent[]): Promise<FaqContent[]> {
  return withFallback(
    "faq",
    (rows) =>
      rows.map((r) => ({
        question: (r.question as string) || "",
        answer: (r.answer as string) || "",
        category: (r.category as string) || "",
      })),
    fallback,
  )
}

export function getBlogPosts(fallback: BlogPostContent[]): Promise<BlogPostContent[]> {
  return withFallback(
    "blog",
    (rows) =>
      rows.map((r) => ({
        title: (r.title as string) || "",
        slug: (r.slug as string) || "",
        excerpt: (r.excerpt as string) || "",
        author: (r.author as string) || "",
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        publishedAt: (r.publishedAt as string) || null,
        views: Number(r.views) || 0,
      })),
    fallback,
  )
}

export function getDocArticles(fallback: DocArticleContent[]): Promise<DocArticleContent[]> {
  return withFallback(
    "docs",
    (rows) =>
      rows.map((r) => ({
        title: (r.title as string) || "",
        slug: (r.slug as string) || "",
        category: (r.category as string) || "",
        readingMinutes: Number(r.readingMinutes) || 0,
      })),
    fallback,
  )
}

import "server-only"
import { canCreateServiceClient, createServiceClient } from "@zequel/shared/supabase/service"
import {
  CMS_RESOURCES,
  cmsRowToModel,
  cmsSelectColumns,
  type CmsModel,
} from "@zequel/types/cms-schema"

// ---------------------------------------------------------------------------
// Public site content layer.
//
// Reads *published* CMS rows from Supabase (via the service client) for the
// marketing site. Every reader accepts a `fallback` so the public site keeps
// rendering sensible copy when the database is empty or unreachable — this is
// important here because the database lives in a separate account and may not
// be seeded yet.
// ---------------------------------------------------------------------------

// Note: published content is read on demand via the service client. Individual
// site pages can opt into ISR with their own `export const revalidate`.

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
    return (data || []).map((row) => cmsRowToModel(config, row as unknown as Record<string, unknown>))
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

export interface StatContent {
  value: string
  label: string
}

export interface StepContent {
  step: string
  title: string
  body: string
}

export interface TestimonialContent {
  quote: string
  name: string
  role: string
}

export interface PrincipleContent {
  title: string
  body: string
}

export interface PillarPointContent {
  icon: string
  text: string
}

export interface PillarContent {
  label: string
  title: string
  body: string
  points: PillarPointContent[]
  image: string
  imageDark?: string
  url: string
}

// --- Readers (one per site section) ----------------------------------------

export async function getHero(page: string, fallback: HeroContent): Promise<HeroContent> {
  const rows = await readPublished("hero")
  const match = rows?.find((r) => String(r.page ?? "").toLowerCase() === page.toLowerCase())
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

export function getStats(fallback: StatContent[], group?: string): Promise<StatContent[]> {
  return withFallback(
    "stats",
    (rows) =>
      rows
        .filter((r) => (group ? (r.group as string) === group : true))
        .map((r) => ({
          value: (r.value as string) || "",
          label: (r.label as string) || "",
        })),
    fallback,
  )
}

export function getSteps(fallback: StepContent[]): Promise<StepContent[]> {
  return withFallback(
    "steps",
    (rows) =>
      rows.map((r) => ({
        step: (r.step as string) || "",
        title: (r.title as string) || "",
        body: (r.body as string) || "",
      })),
    fallback,
  )
}

export function getTestimonials(fallback: TestimonialContent[]): Promise<TestimonialContent[]> {
  return withFallback(
    "testimonials",
    (rows) =>
      rows.map((r) => ({
        quote: (r.quote as string) || "",
        name: (r.name as string) || "",
        role: (r.role as string) || "",
      })),
    fallback,
  )
}

export function getPrinciples(fallback: PrincipleContent[]): Promise<PrincipleContent[]> {
  return withFallback(
    "principles",
    (rows) =>
      rows.map((r) => ({
        title: (r.title as string) || "",
        body: (r.body as string) || "",
      })),
    fallback,
  )
}

export function getPillars(fallback: PillarContent[]): Promise<PillarContent[]> {
  return withFallback(
    "pillars",
    (rows) =>
      rows.map((r) => ({
        label: (r.label as string) || "",
        title: (r.title as string) || "",
        body: (r.body as string) || "",
        points: Array.isArray(r.points)
          ? (r.points as PillarPointContent[]).map((p) => ({
              icon: (p?.icon as string) || "",
              text: (p?.text as string) || "",
            }))
          : [],
        image: (r.image as string) || "",
        imageDark: (r.imageDark as string) || undefined,
        url: (r.url as string) || "",
      })),
    fallback,
  )
}

/** Singleton about-story paragraphs (stored as one row, body split on blank lines). */
export async function getAboutStory(fallback: string[]): Promise<string[]> {
  const rows = await readPublished("about-story")
  const body = rows?.[0]?.body
  if (typeof body !== "string" || body.trim().length === 0) return fallback
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return paragraphs.length > 0 ? paragraphs : fallback
}

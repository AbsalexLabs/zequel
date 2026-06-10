import { AUTH_LINKS } from "@/lib/site/links"
import type {
  HeroContent,
  FeatureContent,
  PricingPlanContent,
  FaqContent,
  BlogPostContent,
  DocArticleContent,
} from "@/lib/site/content"

// ---------------------------------------------------------------------------
// Default copy for the public marketing site. These are used when the CMS has
// no published rows for a given section (e.g. before the database is seeded).
// They mirror the original hardcoded content so the site looks complete out of
// the box, and are overridden by published CMS rows when present.
// ---------------------------------------------------------------------------

export const HOME_HERO_FALLBACK: HeroContent = {
  eyebrow: "Research System v2.0",
  headline: "Reasoning you can trace, evidence you can trust",
  subhead:
    "Zequel is a structured research workspace that turns scattered documents into evidence-backed answers — every claim sourced, every synthesis traceable, every step accountable.",
  primaryCtaLabel: "Start researching",
  primaryCtaHref: AUTH_LINKS.signup,
  secondaryCtaLabel: "Explore features",
  secondaryCtaHref: "/features",
}

export const FEATURES_FALLBACK: FeatureContent[] = [
  {
    icon: "FileSearch",
    title: "Multi-document analysis",
    description:
      "Ingest PDFs, papers, and notes. Zequel reads across your entire corpus and reasons over it as one connected body of evidence.",
    group: "home",
  },
  {
    icon: "Quote",
    title: "Cited synthesis",
    description:
      "Every claim links back to its source passage. No hallucinated facts — answers are grounded in the documents you provide.",
    group: "home",
  },
  {
    icon: "GitBranch",
    title: "Traceable reasoning",
    description:
      "Follow the full chain of thought from question to conclusion. Inspect each step, verify each inference, reproduce each result.",
    group: "home",
  },
  {
    icon: "ShieldCheck",
    title: "Safety & governance",
    description:
      "Built-in safety flags, audit logs, and role controls keep research accountable across individuals and teams.",
    group: "home",
  },
  {
    icon: "Layers",
    title: "Structured workspace",
    description:
      "Organize threads, documents, and findings into a control center designed for sustained, serious research work.",
    group: "home",
  },
  {
    icon: "Gauge",
    title: "Fast, low-cost inference",
    description:
      "Sub-second median responses on dense source material, so you stay in flow instead of waiting on the model.",
    group: "home",
  },
]

export const PRICING_FALLBACK: PricingPlanContent[] = [
  {
    name: "Researcher",
    priceMonthly: 0,
    priceYearly: 0,
    description: "For individuals starting evidence-backed research.",
    ctaLabel: "Start free",
    highlighted: false,
    features: ["Up to 100 documents", "Cited synthesis", "Single workspace", "Community support"],
  },
  {
    name: "Professional",
    priceMonthly: 24,
    priceYearly: 240,
    description: "For working researchers who need depth and speed.",
    ctaLabel: "Start 14-day trial",
    highlighted: true,
    features: [
      "Unlimited documents",
      "Traceable reasoning trails",
      "Priority inference",
      "Export & API access",
      "Email support",
    ],
  },
  {
    name: "Team",
    priceMonthly: 89,
    priceYearly: 890,
    description: "For teams that need governance and accountability.",
    ctaLabel: "Talk to us",
    highlighted: false,
    features: [
      "Everything in Professional",
      "Role-based access control",
      "Audit logs & safety center",
      "Shared workspaces",
      "Dedicated support",
    ],
  },
]

export const PRICING_FAQ_FALLBACK: FaqContent[] = [
  {
    question: "Is there really a free tier?",
    answer:
      "Yes. The Researcher plan is free forever and includes cited synthesis across up to 100 documents — no credit card required.",
    category: "pricing",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Absolutely. Upgrade, downgrade, or cancel at any time from your workspace. Changes take effect immediately.",
    category: "pricing",
  },
  {
    question: "How does billing work for teams?",
    answer:
      "Team plans are billed per workspace with seats included. Reach out and we will tailor a plan to your organization.",
    category: "pricing",
  },
  {
    question: "Do you offer education or research discounts?",
    answer:
      "We do. Contact us with details about your institution and we will set you up with a discounted plan.",
    category: "pricing",
  },
]

export const BLOG_FALLBACK: BlogPostContent[] = [
  {
    title: "Why every claim in your research should carry its own evidence",
    slug: "claims-carry-evidence",
    excerpt:
      "We rebuilt the research workflow around a simple rule: nothing ships without a source. Here's how citation-first thinking changes the way teams work.",
    author: "Product",
    tags: ["Product"],
    publishedAt: "2026-03-01T00:00:00.000Z",
    views: 0,
  },
  {
    title: "Designing a retrieval layer that researchers actually trust",
    slug: "retrieval-layer-trust",
    excerpt: "How we built retrieval that researchers can rely on, end to end.",
    author: "Engineering",
    tags: ["Engineering"],
    publishedAt: "2026-03-01T00:00:00.000Z",
    views: 0,
  },
  {
    title: "Measuring hallucination: how we score every generated answer",
    slug: "measuring-hallucination",
    excerpt: "A look at how we score the reliability of every generated answer.",
    author: "Research",
    tags: ["Research"],
    publishedAt: "2026-02-01T00:00:00.000Z",
    views: 0,
  },
  {
    title: "Building Zequel as a remote-first, evidence-first team",
    slug: "remote-first-evidence-first",
    excerpt: "How we operate as a remote-first, evidence-first team.",
    author: "Company",
    tags: ["Company"],
    publishedAt: "2026-02-01T00:00:00.000Z",
    views: 0,
  },
  {
    title: "From prompt to provenance: the anatomy of a Zequel session",
    slug: "prompt-to-provenance",
    excerpt: "Tracing a single Zequel session from prompt to full provenance.",
    author: "Product",
    tags: ["Product"],
    publishedAt: "2026-01-01T00:00:00.000Z",
    views: 0,
  },
  {
    title: "A practical workflow for literature reviews that hold up",
    slug: "literature-review-workflow",
    excerpt: "A practical, repeatable workflow for literature reviews that hold up.",
    author: "Guides",
    tags: ["Guides"],
    publishedAt: "2026-01-01T00:00:00.000Z",
    views: 0,
  },
]

export const DOCS_FALLBACK: DocArticleContent[] = [
  { title: "Quickstart", slug: "quickstart", category: "Getting started", readingMinutes: 4 },
  { title: "Core concepts", slug: "core-concepts", category: "Getting started", readingMinutes: 6 },
  { title: "Your first session", slug: "first-session", category: "Getting started", readingMinutes: 5 },
  { title: "Workspaces", slug: "workspaces", category: "Getting started", readingMinutes: 4 },
  { title: "Sources & ingestion", slug: "sources-ingestion", category: "Research workflow", readingMinutes: 7 },
  { title: "Citations", slug: "citations", category: "Research workflow", readingMinutes: 5 },
  { title: "Answer scoring", slug: "answer-scoring", category: "Research workflow", readingMinutes: 6 },
  { title: "Exporting", slug: "exporting", category: "Research workflow", readingMinutes: 3 },
  { title: "Connectors overview", slug: "connectors", category: "Integrations", readingMinutes: 5 },
  { title: "Webhooks", slug: "webhooks", category: "Integrations", readingMinutes: 4 },
  { title: "Authentication", slug: "authentication", category: "API reference", readingMinutes: 5 },
  { title: "Sessions API", slug: "sessions-api", category: "API reference", readingMinutes: 8 },
  { title: "Documents API", slug: "documents-api", category: "API reference", readingMinutes: 7 },
  { title: "Rate limits", slug: "rate-limits", category: "API reference", readingMinutes: 3 },
  { title: "Data handling", slug: "data-handling", category: "Security & trust", readingMinutes: 6 },
  { title: "Access control", slug: "access-control", category: "Security & trust", readingMinutes: 5 },
  { title: "Audit logs", slug: "audit-logs", category: "Security & trust", readingMinutes: 4 },
  { title: "Roles & permissions", slug: "roles-permissions", category: "Admin & teams", readingMinutes: 5 },
]

// Maps doc categories to the icon shown on the docs landing page.
export const DOC_CATEGORY_ICONS: Record<string, string> = {
  "Getting started": "Rocket",
  "Research workflow": "BookOpen",
  Integrations: "Plug",
  "API reference": "Terminal",
  "Security & trust": "Shield",
  "Admin & teams": "Layers",
}

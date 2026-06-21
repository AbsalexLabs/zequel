import { AUTH_LINKS } from "@/lib/site/links"
import type {
  HeroContent,
  FeatureContent,
  PricingPlanContent,
  FaqContent,
  BlogPostContent,
  DocArticleContent,
  StatContent,
  StepContent,
  TestimonialContent,
  PrincipleContent,
  PillarContent,
} from "@/lib/site/content"

// ---------------------------------------------------------------------------
// Default copy for the public marketing site. These are used when the CMS has
// no published rows for a given section (e.g. before the database is seeded).
// They mirror the original hardcoded content so the site looks complete out of
// the box, and are overridden by published CMS rows when present.
// ---------------------------------------------------------------------------

export const HOME_HERO_FALLBACK: HeroContent = {
  eyebrow: "AI Workspace",
  headline: "Research better. Learn faster. Build smarter.",
  subhead:
    "Zequel is an intelligent workspace for students, researchers, and developers. Analyze documents, discover insights, learn complex topics, and create projects with AI that prioritizes transparency, evidence, and trust.",
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
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Perfect for getting started with evidence-backed research.",
    ctaLabel: "Start free",
    highlighted: false,
    features: [
      "20 AI requests per day",
      "3 document uploads",
      "Basic study mode",
      "Cited synthesis",
      "Community support",
    ],
  },
  {
    name: "Premium Lite",
    priceMonthly: 2.99,
    priceYearly: 29,
    description: "For regular researchers who need depth and speed.",
    ctaLabel: "Upgrade to Lite",
    highlighted: true,
    features: [
      "200 AI requests per day",
      "30 document uploads",
      "Advanced study mode",
      "Research mode access",
      "Multi-document analysis",
      "Email support",
    ],
  },
  {
    name: "Premium Pro",
    priceMonthly: 5.99,
    priceYearly: 59,
    description: "For power users who need the highest limits.",
    ctaLabel: "Upgrade to Pro",
    highlighted: false,
    features: [
      "1,000 AI requests per day",
      "100 document uploads",
      "Advanced+ study mode",
      "Highest priority speed",
      "Priority support",
      "Early access features",
    ],
  },
]

export const PRICING_FAQ_FALLBACK: FaqContent[] = [
  {
    question: "Is there really a free tier?",
    answer:
      "Yes. The Free plan is free forever and includes cited synthesis with 20 AI requests per day — no credit card required.",
    category: "pricing",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Absolutely. Upgrade, downgrade, or cancel at any time from your workspace. Changes take effect immediately.",
    category: "pricing",
  },
  {
    question: "What's the difference between Premium Lite and Premium Pro?",
    answer:
      "Premium Lite unlocks research mode and multi-document analysis with 200 AI requests per day. Premium Pro raises that to 1,000 requests per day with the highest priority speed and early access to new features.",
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

// --- Home: stats band ------------------------------------------------------
export const HOME_STATS_FALLBACK: StatContent[] = [
  { value: "92,418", label: "Documents indexed" },
  { value: "1.3M", label: "Evidence-backed queries" },
  { value: "612ms", label: "Median response" },
  { value: "99.98%", label: "Uptime" },
]

// --- Home: how it works ----------------------------------------------------
export const HOME_STEPS_FALLBACK: StepContent[] = [
  {
    step: "01",
    title: "Bring your sources",
    body: "Upload documents, papers, and notes — or connect a corpus. Zequel indexes everything into a searchable evidence base.",
  },
  {
    step: "02",
    title: "Ask in plain language",
    body: "Pose questions the way you think about them. Zequel retrieves the relevant passages and reasons across them.",
  },
  {
    step: "03",
    title: "Get traceable answers",
    body: "Receive synthesized conclusions with every claim cited back to its source — ready to verify, share, or build on.",
  },
]

// --- Home: testimonials ----------------------------------------------------
export const HOME_TESTIMONIALS_FALLBACK: TestimonialContent[] = [
  {
    quote:
      "Zequel changed how my lab handles literature reviews. Every synthesis comes with citations, so I can verify in seconds instead of hours.",
    name: "Dr. Elena Royce",
    role: "Principal Researcher, Computational Biology",
    avatar: "/site/voice-elena.png",
  },
  {
    quote:
      "The traceable reasoning is the killer feature. I can show reviewers exactly how a conclusion was reached, step by step.",
    name: "Marcus Adeyemi",
    role: "Policy Analyst",
    avatar: "/site/voice-marcus.png",
  },
  {
    quote:
      "It feels like an instrument built for serious work — dense, fast, and honest about its sources. Nothing else comes close.",
    name: "Priya Nair",
    role: "Research Lead, Legal Tech",
    avatar: "/site/voice-priya.png",
  },
]

// --- About: story paragraphs ----------------------------------------------
export const ABOUT_STORY_FALLBACK: string[] = [
  "Most AI tools optimize for fluency. They produce text that sounds right, whether or not it is. For research — where a wrong conclusion has real consequences — that is not good enough.",
  "We built Zequel as an instrument, not a chatbot. It reasons across the documents you trust, cites every claim it makes, and records the path from question to answer so you can verify each step. The point is not to replace the researcher, but to make rigorous work faster and more accountable.",
  "We are a small, focused team at Absalex Labs, building for the people who cannot afford to be wrong.",
]

// --- About: values band ----------------------------------------------------
export const ABOUT_VALUES_FALLBACK: StatContent[] = [
  { value: "2023", label: "Founded" },
  { value: "Remote", label: "Team" },
  { value: "Absalex Labs", label: "Built by" },
  { value: "Research-first", label: "Mandate" },
]

// --- About: principles -----------------------------------------------------
export const ABOUT_PRINCIPLES_FALLBACK: PrincipleContent[] = [
  {
    title: "Evidence over assertion",
    body: "A confident answer means nothing without a source. We hold every output to the standard of provable, citable evidence.",
  },
  {
    title: "Transparency over magic",
    body: "Research tools should show their work. We expose the full reasoning path so results can be inspected and reproduced.",
  },
  {
    title: "Rigor over speed",
    body: "We move fast, but never at the expense of correctness. Defensible conclusions are the only conclusions worth shipping.",
  },
  {
    title: "Accountability over convenience",
    body: "Serious research demands a record. Audit trails and governance are foundations, not afterthoughts.",
  },
]

// --- Features: pillars -----------------------------------------------------
export const FEATURES_PILLARS_FALLBACK: PillarContent[] = [
  {
    label: "Study Workspace",
    title: "Read, ask, and learn in one place",
    body: "Study mode brings your documents and an AI tutor into a single focused view. Read source material on one side, ask questions on the other, and keep every answer anchored to the passages it came from.",
    image: "/site/workspace-light.jpg",
    imageDark: "/site/workspace-dark.jpg",
    url: "zequel study workspace",
    points: [
      { icon: "FileSearch", text: "Documents and chat side by side" },
      { icon: "Quote", text: "Answers anchored to the source text" },
      { icon: "Layers", text: "Everything saved to your study" },
    ],
  },
  {
    label: "Research Workspace",
    title: "Deep research, grounded in evidence",
    body: "Research mode lets you summarize, define key terms, and analyze documents at depth. Every response is backed by an evidence panel listing the exact referenced sources and pages, so conclusions stay defensible.",
    image: "/site/research-light.jpg",
    imageDark: "/site/research-dark.jpg",
    url: "zequel Research Workspace",
    points: [
      { icon: "Quote", text: "Summarize and define key terms" },
      { icon: "Database", text: "Evidence panel with referenced sources" },
      { icon: "GitBranch", text: "Page-level citations you can verify" },
    ],
  },
  {
    label: "Coding Workspace",
    title: "Code with an AI companion that knows your project",
    body: "Coding mode pairs a full editor with an AI assistant that reads your files for context. Explain code, find bugs, refactor, optimize, and generate documentation — with a Learning Mode that guides you instead of just handing over answers.",
    image: "/site/coding-light.jpg",
    imageDark: "/site/coding-dark.jpg",
    url: "zequel coding workspace",
    points: [
      { icon: "GitBranch", text: "Explain, refactor, and review code" },
      { icon: "Layers", text: "Attach project files for real context" },
      { icon: "Gauge", text: "Learning Mode for guided hints" },
    ],
  },
]

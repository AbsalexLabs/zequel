import type {
  BlogPost,
  BugReport,
  ChangelogEntry,
  CmsPage,
  ContactMessage,
  DocArticle,
  FaqItem,
  FeatureItem,
  FeatureRequest,
  HeroSection,
  MediaAsset,
  PricingPlan,
} from '@zequel/types'

// ---------------------------------------------------------------------------
// Deterministic mock content for the Website CMS. Presentation-only.
// To go live, replace these exports with fetches from the content database.
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function hoursAgo(n: number): string {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

export const cmsPages: CmsPage[] = [
  {
    id: "pg_home",
    title: "Home",
    slug: "/",
    status: "published",
    seoTitle: "Zequel — AI Research Workspace",
    seoDescription: "Synthesize literature, analyze documents, and accelerate research with Zequel.",
    sections: 7,
    updatedAt: hoursAgo(5),
    updatedBy: "Elena Royce",
  },
  {
    id: "pg_features",
    title: "Features",
    slug: "/features",
    status: "published",
    seoTitle: "Features — Zequel",
    seoDescription: "Everything Zequel offers for research teams.",
    sections: 5,
    updatedAt: daysAgo(2),
    updatedBy: "Marcus Vaughn",
  },
  {
    id: "pg_pricing",
    title: "Pricing",
    slug: "/pricing",
    status: "published",
    seoTitle: "Pricing — Zequel",
    seoDescription: "Simple plans that scale with your research.",
    sections: 4,
    updatedAt: daysAgo(4),
    updatedBy: "Elena Royce",
  },
  {
    id: "pg_about",
    title: "About",
    slug: "/about",
    status: "draft",
    seoTitle: "About — Zequel",
    seoDescription: "Our mission to accelerate human knowledge.",
    sections: 3,
    updatedAt: daysAgo(9),
    updatedBy: "Priya Nair",
  },
  {
    id: "pg_contact",
    title: "Contact",
    slug: "/contact",
    status: "published",
    seoTitle: "Contact — Zequel",
    seoDescription: "Get in touch with the Zequel team.",
    sections: 2,
    updatedAt: daysAgo(14),
    updatedBy: "Marcus Vaughn",
  },
  {
    id: "pg_changelog",
    title: "Changelog",
    slug: "/changelog",
    status: "scheduled",
    seoTitle: "Changelog — Zequel",
    seoDescription: "What's new in Zequel.",
    sections: 1,
    updatedAt: daysAgo(1),
    updatedBy: "Elena Royce",
  },
]

export const heroSections: HeroSection[] = [
  {
    id: "hero_home",
    page: "Home",
    eyebrow: "AI research workspace",
    headline: "Research at the speed of thought",
    subhead:
      "Zequel synthesizes thousands of sources, analyzes your documents, and surfaces citations you can trust.",
    primaryCtaLabel: "Start free",
    primaryCtaHref: "/signup",
    secondaryCtaLabel: "Book a demo",
    secondaryCtaHref: "/demo",
    status: "published",
    updatedAt: hoursAgo(5),
  },
  {
    id: "hero_features",
    page: "Features",
    eyebrow: "Built for researchers",
    headline: "Every tool your investigation needs",
    subhead: "From literature reviews to data synthesis, Zequel keeps your evidence organized and verifiable.",
    primaryCtaLabel: "Explore features",
    primaryCtaHref: "/features",
    secondaryCtaLabel: "View pricing",
    secondaryCtaHref: "/pricing",
    status: "published",
    updatedAt: daysAgo(2),
  },
  {
    id: "hero_pricing",
    page: "Pricing",
    eyebrow: "Simple pricing",
    headline: "Plans that scale with your work",
    subhead: "Start free and upgrade as your research grows. No hidden fees.",
    primaryCtaLabel: "Get started",
    primaryCtaHref: "/signup",
    secondaryCtaLabel: "Contact sales",
    secondaryCtaHref: "/contact",
    status: "draft",
    updatedAt: daysAgo(4),
  },
]

export const featureItems: FeatureItem[] = [
  {
    id: "feat_synth",
    title: "Literature synthesis",
    description: "Summarize and cross-reference thousands of papers in seconds with verifiable citations.",
    icon: "BookOpen",
    group: "Research",
    order: 1,
    status: "published",
    updatedAt: daysAgo(3),
  },
  {
    id: "feat_docs",
    title: "Document analysis",
    description: "Upload PDFs, DOCX, and more — Zequel indexes and reasons over your private corpus.",
    icon: "FileSearch",
    group: "Research",
    order: 2,
    status: "published",
    updatedAt: daysAgo(3),
  },
  {
    id: "feat_cite",
    title: "Trusted citations",
    description: "Every claim links back to its source so you can verify and export with confidence.",
    icon: "Quote",
    group: "Trust",
    order: 3,
    status: "published",
    updatedAt: daysAgo(6),
  },
  {
    id: "feat_collab",
    title: "Team workspaces",
    description: "Share research threads, documents, and findings across your whole team.",
    icon: "Users",
    group: "Collaboration",
    order: 4,
    status: "published",
    updatedAt: daysAgo(8),
  },
  {
    id: "feat_api",
    title: "Developer API",
    description: "Integrate Zequel synthesis directly into your own tools and pipelines.",
    icon: "Code",
    group: "Platform",
    order: 5,
    status: "draft",
    updatedAt: daysAgo(1),
  },
]

export const pricingPlans: PricingPlan[] = [
  {
    id: "plan_free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "For individuals getting started with AI research.",
    features: ["50 AI requests / day", "1 workspace", "Community support", "Basic citations"],
    highlighted: false,
    ctaLabel: "Start free",
    status: "published",
    order: 1,
    updatedAt: daysAgo(4),
  },
  {
    id: "plan_pro",
    name: "Pro",
    priceMonthly: 29,
    priceYearly: 290,
    description: "For power users and independent researchers.",
    features: ["2,000 AI requests / day", "Unlimited documents", "Priority support", "Citation export", "Advanced models"],
    highlighted: true,
    ctaLabel: "Upgrade to Pro",
    status: "published",
    order: 2,
    updatedAt: daysAgo(4),
  },
  {
    id: "plan_team",
    name: "Team",
    priceMonthly: 99,
    priceYearly: 990,
    description: "For research teams that collaborate.",
    features: ["10,000 AI requests / day", "12 seats included", "Shared workspaces", "Admin controls", "SSO"],
    highlighted: false,
    ctaLabel: "Start Team trial",
    status: "published",
    order: 3,
    updatedAt: daysAgo(4),
  },
  {
    id: "plan_ent",
    name: "Enterprise",
    priceMonthly: 0,
    priceYearly: 0,
    description: "For organizations with custom needs.",
    features: ["Unlimited usage", "Dedicated support", "Custom models", "On-prem options", "SLA & DPA"],
    highlighted: false,
    ctaLabel: "Contact sales",
    status: "published",
    order: 4,
    updatedAt: daysAgo(7),
  },
]

const DOC_CATEGORIES = ["Getting Started", "Guides", "API Reference", "Integrations", "Troubleshooting"]
const DOC_TITLES = [
  "Quickstart in 5 minutes",
  "Uploading and indexing documents",
  "Running your first synthesis",
  "Authentication & API keys",
  "Webhooks reference",
  "Connecting Zotero",
  "Exporting citations",
  "Rate limits explained",
  "Managing team workspaces",
  "Troubleshooting failed uploads",
]

export const docArticles: DocArticle[] = DOC_TITLES.map((title, i) => ({
  id: `doc_${(100 + i).toString(36)}`,
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  category: DOC_CATEGORIES[i % DOC_CATEGORIES.length],
  status: i % 7 === 0 ? "draft" : "published",
  readingMinutes: 2 + ((i * 3) % 9),
  order: i + 1,
  updatedAt: daysAgo(i * 2),
  updatedBy: i % 2 === 0 ? "Elena Royce" : "Marcus Vaughn",
}))

const BLOG_TITLES = [
  "How we built verifiable AI citations",
  "The state of AI in academic research 2026",
  "Synthesis vs. summarization: what's the difference",
  "5 workflows to speed up your literature review",
  "Introducing team workspaces",
  "Why provenance matters in AI research",
]
const BLOG_AUTHORS = ["Elena Royce", "Marcus Vaughn", "Priya Nair"]
const BLOG_TAGS = [
  ["engineering", "ai"],
  ["research", "industry"],
  ["product"],
  ["guides", "productivity"],
  ["product", "announcement"],
  ["trust", "ai"],
]

export const blogPosts: BlogPost[] = BLOG_TITLES.map((title, i) => {
  const status = i === 0 ? "published" : i === 4 ? "scheduled" : i === 5 ? "draft" : "published"
  return {
    id: `post_${(200 + i).toString(36)}`,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    excerpt: "A closer look at the ideas and engineering behind Zequel's research platform.",
    author: BLOG_AUTHORS[i % BLOG_AUTHORS.length],
    tags: BLOG_TAGS[i % BLOG_TAGS.length],
    status,
    publishedAt: status === "published" ? daysAgo(i * 6 + 2) : null,
    updatedAt: daysAgo(i * 3),
    views: status === "published" ? 1200 + ((i * 1731) % 9000) : 0,
  }
})

export const changelogEntries: ChangelogEntry[] = [
  {
    id: "cl_290",
    version: "2.9.0",
    title: "Team workspaces and shared threads",
    type: "feature",
    body: "Invite your team, share research threads, and collaborate on document collections in real time.",
    status: "published",
    releasedAt: daysAgo(2),
  },
  {
    id: "cl_285",
    version: "2.8.5",
    title: "Faster document indexing",
    type: "improvement",
    body: "Indexing throughput improved by 40% for large PDF uploads.",
    status: "published",
    releasedAt: daysAgo(11),
  },
  {
    id: "cl_284",
    version: "2.8.4",
    title: "Fixed citation export formatting",
    type: "fix",
    body: "Resolved an issue where BibTeX exports dropped author middle initials.",
    status: "published",
    releasedAt: daysAgo(18),
  },
  {
    id: "cl_283",
    version: "2.8.3",
    title: "Session security hardening",
    type: "security",
    body: "Rotated signing keys and tightened session expiry for shared links.",
    status: "published",
    releasedAt: daysAgo(25),
  },
  {
    id: "cl_300",
    version: "3.0.0-beta",
    title: "New synthesis engine (beta)",
    type: "feature",
    body: "A rebuilt synthesis pipeline with deeper cross-document reasoning. Rolling out to beta users.",
    status: "draft",
    releasedAt: daysAgo(0),
  },
]

const FAQ_CATEGORIES = ["General", "Billing", "Privacy", "Technical"]
const FAQ_DATA: [string, string][] = [
  ["What is Zequel?", "Zequel is an AI research workspace that synthesizes literature and analyzes your documents."],
  ["Is there a free plan?", "Yes — the Free plan includes 50 AI requests per day and one workspace."],
  ["How are citations verified?", "Every claim links back to its source document so you can verify provenance."],
  ["Can I cancel anytime?", "Yes, you can cancel or change your plan at any time from billing settings."],
  ["Is my data private?", "Your documents are encrypted and never used to train shared models."],
  ["Do you offer SSO?", "SSO is available on Team and Enterprise plans."],
  ["Which file types are supported?", "PDF, DOCX, TXT, Markdown, and web pages are supported."],
  ["Do you have an API?", "Yes, the developer API is available on Pro and above."],
]

export const faqItems: FaqItem[] = FAQ_DATA.map(([question, answer], i) => ({
  id: `faq_${(300 + i).toString(36)}`,
  question,
  answer,
  category: FAQ_CATEGORIES[i % FAQ_CATEGORIES.length],
  order: i + 1,
  status: i % 6 === 0 ? "draft" : "published",
  updatedAt: daysAgo(i * 4),
}))

const CONTACT_NAMES = ["Aiko Tanaka", "Leon Mercer", "Sara Holt", "Devon Quist", "Mara Bellini", "Kojo Asante", "Ines Vega", "Rafael Cruz"]
const CONTACT_SUBJECTS = [
  "Question about enterprise pricing",
  "Partnership opportunity",
  "Press inquiry",
  "Help with my account",
  "Bulk licensing for university",
  "Feedback on the product",
  "Integration question",
  "Demo request",
]

export const contactMessages: ContactMessage[] = CONTACT_NAMES.map((name, i) => {
  const status = i === 0 ? "new" : i === 1 ? "new" : i % 4 === 0 ? "replied" : i % 5 === 0 ? "archived" : "read"
  return {
    id: `msg_${(400 + i).toString(36)}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@mail.com`,
    subject: CONTACT_SUBJECTS[i % CONTACT_SUBJECTS.length],
    message:
      "Hi team, I'd love to learn more about how Zequel could fit our research workflow. Could we set up a time to talk? Thanks!",
    status,
    createdAt: hoursAgo(i * 6 + 1),
  }
})

const FR_TITLES = [
  "Zotero two-way sync",
  "Dark mode for the reader",
  "Bulk document upload via folder",
  "Custom citation styles",
  "Slack notifications",
  "Offline reading mode",
  "Export to Notion",
  "Audio summaries of papers",
]

export const featureRequests: FeatureRequest[] = FR_TITLES.map((title, i) => {
  const statuses = ["open", "planned", "in_progress", "shipped", "declined"] as const
  return {
    id: `fr_${(500 + i).toString(36)}`,
    title,
    description: "A user-submitted idea to improve the Zequel research experience.",
    requester: CONTACT_NAMES[i % CONTACT_NAMES.length],
    email: `${CONTACT_NAMES[i % CONTACT_NAMES.length].toLowerCase().replace(/\s+/g, ".")}@mail.com`,
    votes: 4 + ((i * 37) % 240),
    status: statuses[i % statuses.length],
    createdAt: daysAgo(i * 3 + 1),
  }
})

const BUG_TITLES = [
  "Synthesis spinner never stops on Safari",
  "Citation export drops page numbers",
  "Search bar overlaps sidebar on mobile",
  "PDF preview blank for scanned docs",
  "Login redirect loop after SSO",
  "Pricing toggle resets on resize",
  "Markdown tables render misaligned",
]

export const bugReports: BugReport[] = BUG_TITLES.map((title, i) => {
  const severities = ["low", "medium", "high", "critical"] as const
  const statuses = ["new", "triaged", "in_progress", "resolved", "wont_fix"] as const
  return {
    id: `bug_${(600 + i).toString(36)}`,
    title,
    description: "Steps to reproduce attached. Occurs consistently on the latest build.",
    reporter: CONTACT_NAMES[(i * 3) % CONTACT_NAMES.length],
    email: `${CONTACT_NAMES[(i * 3) % CONTACT_NAMES.length].toLowerCase().replace(/\s+/g, ".")}@mail.com`,
    severity: severities[(i * 2) % severities.length],
    status: statuses[i % statuses.length],
    url: ["/synthesis", "/export", "/", "/reader", "/login", "/pricing", "/docs"][i % 7],
    createdAt: hoursAgo(i * 9 + 2),
  }
})

const MEDIA_NAMES: [string, MediaAsset["type"], number, number?, number?][] = [
  ["hero-dashboard.png", "image", 842, 1600, 900],
  ["feature-synthesis.png", "image", 412, 1200, 800],
  ["logo-mark.svg", "icon", 6],
  ["logo-wordmark.svg", "icon", 9],
  ["pricing-bg.jpg", "image", 1240, 2000, 1200],
  ["product-tour.mp4", "video", 18400],
  ["whitepaper-2026.pdf", "document", 2280],
  ["team-photo.jpg", "image", 980, 1600, 1067],
  ["icon-citations.svg", "icon", 4],
  ["blog-cover-citations.png", "image", 560, 1200, 630],
  ["og-default.png", "image", 320, 1200, 630],
  ["demo-walkthrough.mp4", "video", 24100],
]

export const mediaAssets: MediaAsset[] = MEDIA_NAMES.map(([name, type, sizeKb, width, height], i) => ({
  id: `media_${(700 + i).toString(36)}`,
  name,
  type,
  url: `/cms-media/${name}`,
  sizeKb,
  width,
  height,
  uploadedBy: i % 2 === 0 ? "Elena Royce" : "Marcus Vaughn",
  uploadedAt: daysAgo(i * 2 + 1),
}))

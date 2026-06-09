# Zequel Admin Dashboard — Extraction Manifest

> Purpose: a single source of truth for the files, dependencies, and steps required to
> split the Admin Dashboard out of the main Zequel app into its **own standalone Next.js
> project** that can be deployed separately (e.g. `admin.zequel.com`).
>
> Status: the admin dashboard is **already cleanly isolated** in the codebase. It imports
> only shared UI primitives + Supabase helpers + its own private folders. **No product /
> workspace code imports admin code**, so it can be extracted without untangling anything.

---

## 1. Dependency boundary (verified)

The admin dashboard reaches into exactly three buckets:

| Bucket | What | Action on split |
| --- | --- | --- |
| **Admin-only code** | `app/admin/**`, `app/api/admin/**`, `components/admin/**`, `lib/admin/**`, `lib/admin-dashboard/**` | **Move** to the new project |
| **Shared primitives** | `components/ui/**`, `lib/utils.ts` | **Copy** (both apps keep their own copy) |
| **Supabase helpers** | `lib/supabase/*.ts`, `middleware.ts` | **Copy** (new app needs its own auth wiring) |

Nothing in `app/(product)`, `app/workspace`, or `app/auth` imports from `components/admin`
or `lib/admin*`. The boundary is one-directional and clean.

---

## 2. Files that make up the Admin Dashboard

### Routes — pages (`app/admin/`)
- `app/admin/layout.tsx` — shell: sidebar + topbar + `AdminSessionProvider`
- `app/admin/page.tsx` — Overview
- `app/admin/users/page.tsx`
- `app/admin/subscriptions/page.tsx`
- `app/admin/ai-usage/page.tsx`
- `app/admin/conversations/page.tsx`
- `app/admin/documents/page.tsx`
- `app/admin/safety/page.tsx`
- `app/admin/support/page.tsx`
- `app/admin/audit/page.tsx`
- `app/admin/settings/page.tsx`

### Routes — Website CMS (`app/admin/cms/`)
- `app/admin/cms/layout.tsx` — CMS sub-nav wrapper
- `app/admin/cms/page.tsx` — CMS overview
- `app/admin/cms/pages/page.tsx`
- `app/admin/cms/hero/page.tsx`
- `app/admin/cms/features/page.tsx`
- `app/admin/cms/pricing/page.tsx`
- `app/admin/cms/docs/page.tsx`
- `app/admin/cms/blog/page.tsx`
- `app/admin/cms/changelog/page.tsx`
- `app/admin/cms/faq/page.tsx`
- `app/admin/cms/contact/page.tsx`
- `app/admin/cms/feature-requests/page.tsx`
- `app/admin/cms/bug-reports/page.tsx`
- `app/admin/cms/media/page.tsx`

### Routes — API (`app/api/admin/`)
- `app/api/admin/stats/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[id]/route.ts`
- `app/api/admin/subscriptions/route.ts`
- `app/api/admin/ai-usage/route.ts`
- `app/api/admin/audit/route.ts`
- `app/api/admin/settings/route.ts`
- `app/api/admin/rate-limits/route.ts`
- `app/api/admin/bug-reports/route.ts`

### Components (`components/admin/`)
Shell & shared:
- `components/admin/admin-sidebar.tsx`
- `components/admin/admin-topbar.tsx`
- `components/admin/admin-session.tsx`
- `components/admin/role-guard.tsx`
- `components/admin/page-header.tsx`
- `components/admin/stat-card.tsx`
- `components/admin/status-pill.tsx`
- `components/admin/data-table.tsx`
- `components/admin/charts.tsx`
- `components/admin/activity-feed.tsx`
- `components/admin/overview-actions.tsx`

Feature managers:
- `components/admin/user-manager.tsx`
- `components/admin/subscription-manager.tsx`
- `components/admin/ai-usage-manager.tsx`
- `components/admin/conversation-manager.tsx`
- `components/admin/document-manager.tsx`
- `components/admin/safety-manager.tsx`
- `components/admin/support-manager.tsx`

CMS:
- `components/admin/cms/cms-subnav.tsx`
- `components/admin/cms/cms-status-pill.tsx`

### Logic / data (`lib/`)
Admin auth & audit (real):
- `lib/admin/auth.ts` — `verifyAdmin()` RBAC gate (Supabase `profiles.role`)
- `lib/admin/audit.ts`

Admin UI/config/mock layer:
- `lib/admin-dashboard/navigation.ts` — sidebar + RBAC source of truth
- `lib/admin-dashboard/types.ts`
- `lib/admin-dashboard/format.ts`
- `lib/admin-dashboard/mock-data.ts`
- `lib/admin-dashboard/cms-nav.ts`
- `lib/admin-dashboard/cms-types.ts`
- `lib/admin-dashboard/cms-mock-data.ts`

### Shared (copy into the new project)
- `components/ui/**` (only the primitives the admin imports — button, card, input,
  label, textarea, select, switch, separator, badge, table, sheet, sonner/toast)
- `lib/utils.ts`
- `lib/supabase/client.ts`, `server.ts`, `service.ts`, `middleware.ts`
- `middleware.ts` (root)
- `app/globals.css` (design tokens / Zequel theme)
- `app/layout.tsx` (root layout — recreate with the same fonts + tokens)

---

## 3. Environment variables required by the standalone app

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; used by `lib/supabase/service.ts` and admin API routes)

> The admin DB lives in a different Supabase/Vercel account than the main product.
> When the standalone app is created, point these vars at the **admin** account.

---

## 4. Auth model to preserve

- API routes call `verifyAdmin()` from `lib/admin/auth.ts`, which checks
  `supabase.auth.getUser()` then reads `profiles.role` and requires `admin` or `superadmin`.
- The UI gates visibility via `visibleNavItems(role)` + `canAccess()` in
  `lib/admin-dashboard/navigation.ts` and the `<RoleGuard>` component.
- `components/admin/admin-session.tsx` currently provides the role client-side. In the
  standalone app, wire this provider to the real Supabase session/role.

---

## 5. Extraction recipe (when ready)

1. `npx create-next-app@latest zequel-admin` (App Router, TS, Tailwind).
2. Copy `app/globals.css` + font setup from the main app's `app/layout.tsx` so the Zequel
   theme/tokens match exactly.
3. Copy the **shared** buckets (section 2: "Shared").
4. Move the **admin-only** buckets. You can drop the `/admin` URL prefix in the new app
   (so `/admin/cms` becomes `/cms`) OR keep it — see section 6.
5. Recreate `middleware.ts` to protect all routes (the whole app is admin-only now).
6. Set the env vars (section 3) in the new Vercel project, pointed at the admin account.
7. Replace mock-data imports with real Supabase queries (`lib/admin-dashboard/*mock-data*`
   are the only data seams — every manager imports its `initial*` data from there).
8. Deploy to `admin.zequel.com`.

---

## 6. URL prefix decision

- **Keep `/admin` prefix**: zero route edits, simplest move. Good if served at
  `admin.zequel.com/admin/...`.
- **Drop `/admin` prefix**: cleaner URLs (`admin.zequel.com/cms`). Requires updating
  `href`s in `lib/admin-dashboard/navigation.ts`, `lib/admin-dashboard/cms-nav.ts`, and
  the overview quick-links in `app/admin/cms/page.tsx`.

Recommendation: keep the prefix for the first extraction, simplify later.

---

## 7. Data seams (the only thing standing between mock and live)

Every manager is pure UI seeded from these files. Swap these exports for Supabase fetches
and the entire dashboard goes live with no component changes:

- `lib/admin-dashboard/mock-data.ts` — users, subscriptions, AI usage, conversations,
  documents, safety, support, audit, overview stats.
- `lib/admin-dashboard/cms-mock-data.ts` — pages, hero, features, pricing, docs, blog,
  changelog, FAQ, contact messages, feature requests, bug reports, media.

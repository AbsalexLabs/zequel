import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * IMPORTANT SCHEMA NOTE
 * ---------------------
 * In this project the foreign keys on `subscriptions`, `ai_usage_logs`,
 * `conversations`, `documents`, and `admin_audit_logs` all reference
 * `auth.users(id)` — NOT `public.profiles(id)`. Because of that, PostgREST has
 * no relationship to embed (`profiles:user_id (...)` fails with
 * "Could not find a relationship ... in the schema cache").
 *
 * On top of that, email addresses live in `auth.users`, not in
 * `public.profiles` (which only has `full_name`, `role`, `suspended`, ...).
 *
 * These helpers resolve user identities (email + full_name) separately so the
 * admin endpoints can enrich their rows without relying on embedded joins or
 * selecting a non-existent `profiles.email` column.
 */

export interface UserIdentity {
  email: string
  full_name: string | null
}

/**
 * Resolve a map of `userId -> email` for the given user ids.
 * Uses `auth.admin.getUserById` (one lookup per id) which is fine for the
 * page-sized batches the admin lists request.
 */
export async function getEmailsForUserIds(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)))
  const map = new Map<string, string>()

  if (uniqueIds.length === 0) {
    return map
  }

  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(id)
        if (error || !data?.user?.email) return null
        return [id, data.user.email] as const
      } catch {
        return null
      }
    }),
  )

  for (const entry of results) {
    if (entry) map.set(entry[0], entry[1])
  }

  return map
}

/**
 * Resolve the email for a single user id. Returns an empty string when the
 * user can't be found (e.g. deleted auth user with an orphaned profile).
 */
export async function getEmailForUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    if (error || !data?.user?.email) return ''
    return data.user.email
  } catch {
    return ''
  }
}

/**
 * Resolve a map of `userId -> { email, full_name }` for the given user ids.
 *
 * `full_name` comes from `public.profiles` (a single `.in()` query) and
 * `email` from `auth.users` (the admin API). This is the canonical way to
 * "join" profile + auth data given the FKs point at auth.users.
 */
export async function getUserIdentities(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Map<string, UserIdentity>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)))
  const map = new Map<string, UserIdentity>()

  if (uniqueIds.length === 0) {
    return map
  }

  // Profile names in a single round trip.
  const nameMap = new Map<string, string | null>()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uniqueIds)

  for (const p of profiles || []) {
    nameMap.set(p.id, p.full_name ?? null)
  }

  // Emails from auth.users.
  const emailMap = await getEmailsForUserIds(supabase, uniqueIds)

  for (const id of uniqueIds) {
    map.set(id, {
      email: emailMap.get(id) || '',
      full_name: nameMap.get(id) ?? null,
    })
  }

  return map
}

/**
 * Scan `auth.users` for accounts whose email contains the given term and
 * return their ids. Used by the users search so admins can find people by
 * email even though emails are not stored in `public.profiles`.
 *
 * Scans up to `maxPages` pages of `perPage` users (default 1000 accounts),
 * which comfortably covers the current user base.
 */
export async function findUserIdsByEmail(
  supabase: SupabaseClient,
  term: string,
  { perPage = 200, maxPages = 5 }: { perPage?: number; maxPages?: number } = {},
): Promise<string[]> {
  const needle = term.trim().toLowerCase()
  if (!needle) return []

  const ids: string[] = []

  for (let page = 1; page <= maxPages; page++) {
    try {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error || !data?.users?.length) break

      for (const u of data.users) {
        if (u.email && u.email.toLowerCase().includes(needle)) {
          ids.push(u.id)
        }
      }

      if (data.users.length < perPage) break
    } catch {
      break
    }
  }

  return ids
}

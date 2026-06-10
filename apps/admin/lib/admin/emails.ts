import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Emails are stored in `auth.users`, NOT in `public.profiles`. The admin
 * dashboard joins/selects them separately via the service-role auth admin API.
 *
 * These helpers resolve a set of user ids to their email addresses so the
 * various admin list endpoints can enrich their rows without ever selecting a
 * non-existent `profiles.email` column.
 */

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

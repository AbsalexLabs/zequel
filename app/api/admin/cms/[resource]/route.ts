import { verifyAdmin, adminResponse, adminError } from "@/lib/admin/auth"
import { createServiceClient } from "@/lib/supabase/service"
import {
  getCmsResource,
  cmsSelectColumns,
  cmsRowToModel,
  cmsModelToRow,
  type CmsResourceConfig,
} from "@/lib/admin-dashboard/cms-schema"

type Ctx = { params: Promise<{ resource: string }> }

async function resolveResource(ctx: Ctx): Promise<
  | { config: CmsResourceConfig; resource: string; error: null }
  | { config: null; resource: string; error: Response }
> {
  const { resource } = await ctx.params
  const config = getCmsResource(resource)
  if (!config) {
    return { config: null, resource, error: adminError(`Unknown CMS resource: ${resource}`, 404) }
  }
  return { config, resource, error: null }
}

// List rows for a CMS resource with optional search + status filter + paging.
export async function GET(request: Request, ctx: Ctx) {
  const { user, error } = await verifyAdmin()
  if (error || !user) return adminError(error || "Unauthorized", 401)

  const resolved = await resolveResource(ctx)
  if (resolved.error) return resolved.error
  const { config } = resolved

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "200")))
  const offset = (page - 1) * limit

  const supabase = createServiceClient()
  let query = supabase
    .from(config.table)
    .select(cmsSelectColumns(config), { count: "exact" })
    .order(config.orderBy.col, { ascending: config.orderBy.ascending })
    .range(offset, offset + limit - 1)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }
  if (search && config.searchable.length > 0) {
    const safe = search.replace(/[%,()]/g, "")
    query = query.or(config.searchable.map((c) => `${c}.ilike.%${safe}%`).join(","))
  }

  const { data, count, error: queryError } = await query
  if (queryError) return adminError(queryError.message, 500)

  const items = (data || []).map((row) => cmsRowToModel(config, row as Record<string, unknown>))
  return adminResponse({
    items,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

// Create a new row.
export async function POST(request: Request, ctx: Ctx) {
  const { user, error } = await verifyAdmin()
  if (error || !user) return adminError(error || "Unauthorized", 401)

  const resolved = await resolveResource(ctx)
  if (resolved.error) return resolved.error
  const { config } = resolved

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") return adminError("Invalid body", 400)

  const row = cmsModelToRow(config, body as Record<string, unknown>, { isCreate: true })
  if (Object.keys(row).length === 0) return adminError("No valid fields provided", 400)

  const supabase = createServiceClient()
  const { data, error: insertError } = await supabase
    .from(config.table)
    .insert(row)
    .select(cmsSelectColumns(config))
    .single()

  if (insertError) return adminError(insertError.message, 500)
  return adminResponse({ item: cmsRowToModel(config, data as Record<string, unknown>) })
}

// Update an existing row by id.
export async function PATCH(request: Request, ctx: Ctx) {
  const { user, error } = await verifyAdmin()
  if (error || !user) return adminError(error || "Unauthorized", 401)

  const resolved = await resolveResource(ctx)
  if (resolved.error) return resolved.error
  const { config } = resolved

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === "string" ? body.id : ""
  if (!id) return adminError("Missing id", 400)

  const { id: _omit, ...rest } = body as Record<string, unknown>
  const row = cmsModelToRow(config, rest, { isCreate: false })
  if (Object.keys(row).length === 0) return adminError("No valid fields to update", 400)

  const supabase = createServiceClient()
  const { data, error: updateError } = await supabase
    .from(config.table)
    .update(row)
    .eq("id", id)
    .select(cmsSelectColumns(config))
    .single()

  if (updateError) return adminError(updateError.message, 500)
  return adminResponse({ item: cmsRowToModel(config, data as Record<string, unknown>) })
}

// Delete a row by id (passed as ?id= query param).
export async function DELETE(request: Request, ctx: Ctx) {
  const { user, error } = await verifyAdmin()
  if (error || !user) return adminError(error || "Unauthorized", 401)

  const resolved = await resolveResource(ctx)
  if (resolved.error) return resolved.error
  const { config } = resolved

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id") || ""
  if (!id) return adminError("Missing id", 400)

  const supabase = createServiceClient()
  const { error: deleteError } = await supabase.from(config.table).delete().eq("id", id)
  if (deleteError) return adminError(deleteError.message, 500)
  return adminResponse({ success: true })
}

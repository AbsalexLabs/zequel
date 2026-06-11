import { redirect } from "next/navigation"
import { AdminSessionProvider } from "@/components/admin/admin-session"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { verifyAdmin } from "@/lib/admin/auth"
import { cn } from "@/lib/utils"

/**
 * Shared admin chrome (session provider + sidebar + topbar).
 *
 * - `padded` (default): standard dashboard pages render inside a centered,
 *   max-width, vertically-scrolling container with breathing room.
 * - `flush`: dedicated full-height workspaces (e.g. the Support Center) take
 *   over the entire main area edge-to-edge with no outer padding or scroll, so
 *   the tool can manage its own internal layout and scrolling.
 */
export async function AdminShell({
  children,
  variant = "padded",
}: {
  children: React.ReactNode
  variant?: "padded" | "flush"
}) {
  const { user, error } = await verifyAdmin()

  if (error || !user) {
    redirect("/auth/login")
  }

  const flush = variant === "flush"

  return (
    <AdminSessionProvider session={{ id: user.id, name: user.name, email: user.email, role: user.role }}>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <aside className="hidden h-full w-64 shrink-0 border-r border-border lg:block">
          <AdminSidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main
            className={cn(
              "min-h-0 flex-1",
              flush ? "overflow-hidden" : "overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:px-8",
            )}
          >
            {flush ? (
              children
            ) : (
              <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">{children}</div>
            )}
          </main>
        </div>
      </div>
    </AdminSessionProvider>
  )
}

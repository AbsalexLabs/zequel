import { redirect } from "next/navigation"
import { AdminSessionProvider } from "@/components/admin/admin-session"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { verifyAdmin } from "@/lib/admin/auth"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, error } = await verifyAdmin()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <AdminSessionProvider session={{ id: user.id, name: user.name, email: user.email, role: user.role }}>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <aside className="hidden h-full w-64 shrink-0 border-r border-border lg:block">
          <AdminSidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">{children}</div>
          </main>
        </div>
      </div>
    </AdminSessionProvider>
  )
}

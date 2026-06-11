import { AdminShell } from "@/components/admin/admin-shell"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell variant="padded">{children}</AdminShell>
}

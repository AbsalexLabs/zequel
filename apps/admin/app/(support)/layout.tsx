import { AdminShell } from "@/components/admin/admin-shell"

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell variant="flush">{children}</AdminShell>
}

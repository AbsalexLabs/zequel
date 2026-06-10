import { CmsSubnav } from "@/components/admin/cms/cms-subnav"

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8">
      <CmsSubnav />
      {children}
    </div>
  )
}

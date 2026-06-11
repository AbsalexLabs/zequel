import { PageHeader } from "@/components/admin/page-header"
import { SupportCenter } from "@/components/admin/support/support-center"

export default function SupportPage() {
  return (
    <>
      <PageHeader
        title="Support Center"
        description="Zequel's internal support operating system — tickets, conversations, and assignment."
      />
      <SupportCenter />
    </>
  )
}

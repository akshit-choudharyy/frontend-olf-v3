import { ComplaintReportsPage } from '@/components/modules/Reports/ComplaintReportsPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/complaint-reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ComplaintReportsPage />
  )
}

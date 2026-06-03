import { OrderReports } from '@/components/modules/Reports/OrderReports'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <OrderReports />
  )
}

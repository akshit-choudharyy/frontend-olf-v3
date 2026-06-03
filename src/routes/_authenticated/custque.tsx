import CustomerQueries from '@/components/modules/Queries/CustomerQueries'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/custque')({
  component: RouteComponent,
})

function RouteComponent() {
  return <CustomerQueries/>
}

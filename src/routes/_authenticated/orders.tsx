import Orders from '@/components/modules/Orders/Orders'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/orders')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Orders/>
}

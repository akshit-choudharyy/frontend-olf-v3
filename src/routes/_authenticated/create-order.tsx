import AddOrder from '@/components/modules/Orders/AddOrder'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/create-order')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AddOrder/>
}

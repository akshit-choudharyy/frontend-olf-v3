import InactiveOutlets from '@/components/modules/Outlets/InactiveOutlets'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/inactiveoutlets')({
  component: RouteComponent,
})

function RouteComponent() {
  return <InactiveOutlets />
}

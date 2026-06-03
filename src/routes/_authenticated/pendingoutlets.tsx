import PendingOutlets from '@/components/modules/Outlets/PendingOutlets'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/pendingoutlets')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PendingOutlets/>
}

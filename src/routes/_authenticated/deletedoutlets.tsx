import DeletedOutlets from '@/components/modules/Outlets/DeletedOutlets'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/deletedoutlets')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DeletedOutlets/>
}

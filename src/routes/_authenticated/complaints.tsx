import Complaints from '@/components/modules/Complaints/Complaints'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/complaints')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Complaints />
}

import FssaiExp from '@/components/modules/Queries/FssaiExp'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/fssaiexp')({
  component: RouteComponent,
})

function RouteComponent() {
  return <FssaiExp/>
}

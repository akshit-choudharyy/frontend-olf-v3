import Roles from '@/components/modules/HR/Roles'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/Roles')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Roles/>
}

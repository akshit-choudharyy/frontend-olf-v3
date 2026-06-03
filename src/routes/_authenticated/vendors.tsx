import Vendors from '@/components/modules/Outlets/Vendors'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/vendors')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Vendors/>
}

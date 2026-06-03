import DeliveryPersons from '@/components/modules/Outlets/DeliveryPersons'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/delivery/$outletid')({
  component: RouteComponent,
})

function RouteComponent() {
     const { outletid } = useParams({ from: '/_authenticated/delivery/$outletid' })
  
  return <DeliveryPersons outletId={Number(outletid)} />
}

import OutOrders from '@/components/modules/Orders/OutOrders'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outorders/$outletid')({
  component: RouteComponent,
})

function RouteComponent() {
    const { outletid } = useParams({ from: '/_authenticated/outorders/$outletid' })
  
  return <OutOrders outletid={outletid}/>
}

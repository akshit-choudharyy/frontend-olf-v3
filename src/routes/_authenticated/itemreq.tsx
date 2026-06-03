import ItemReq from '@/components/modules/Queries/ItemReq'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/itemreq')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ItemReq/>
}

import NewItemReq from '@/components/modules/Queries/NewItemReq'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/newitemreq')({
  component: RouteComponent,
})

function RouteComponent() {
  return <NewItemReq/>
}

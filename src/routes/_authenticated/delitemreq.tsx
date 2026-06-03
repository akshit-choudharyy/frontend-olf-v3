import DelItemReq from '@/components/modules/Queries/DelItemReq'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/delitemreq')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DelItemReq/>
}

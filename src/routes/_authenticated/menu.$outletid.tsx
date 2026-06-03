import Menus from '@/components/modules/Outlets/Menus'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/menu/$outletid')({
  component: RouteComponent,
})

function RouteComponent() {
   const { outletid } = useParams({ from: '/_authenticated/menu/$outletid' })
  return( <Menus  outletId={Number(outletid)}/>)
}

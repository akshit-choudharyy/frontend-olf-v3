import UnverifiedMenu from '@/components/modules/Outlets/UnverifiedMenu'
import { createFileRoute, useParams} from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/pendingmenu/$outletid')({
  component: RouteComponent,
})

function RouteComponent() {
     const { outletid } = useParams({ from: '/_authenticated/pendingmenu/$outletid' })
  
  return <UnverifiedMenu outletId={Number(outletid)} />;
}

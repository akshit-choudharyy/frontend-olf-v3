import WalletHistory from '@/components/modules/wallet/WalletHistory';
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/wallet/$outletid')({
  component: RouteComponent,
})

function RouteComponent() {
    const {outletid} = useParams({ from: '/_authenticated/wallet/$outletid' });

      
  return <WalletHistory outletid={Number(outletid)}/>
}

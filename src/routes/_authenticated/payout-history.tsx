import PayoutHistory from '@/components/modules/HR/PayoutHistory'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/payout-history')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PayoutHistory />;
}

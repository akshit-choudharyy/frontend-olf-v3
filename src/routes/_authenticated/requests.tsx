import WithdrawalRequests from '@/components/modules/wallet/WithdrawalRequests'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/requests')({
  component: RouteComponent,
})

function RouteComponent() {
  return <WithdrawalRequests/>
}

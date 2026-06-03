import Dashboard from '@/components/modules/HR/Dashboard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/hr')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Dashboard />
}

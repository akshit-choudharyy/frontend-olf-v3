import Dashboard from '@/components/modules/Dashboard/Dashboard'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_authenticated/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
    
      <Dashboard/>
    </>
  )
}
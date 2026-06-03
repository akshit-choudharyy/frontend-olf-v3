import AllQue from '@/components/modules/Queries/AllQue'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/allque')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AllQue/>
}

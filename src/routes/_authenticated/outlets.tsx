import Stations from '@/components/modules/Outlets/Stations'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outlets')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Stations/>
}

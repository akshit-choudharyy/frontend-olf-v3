import Stations from '@/components/modules/Stations/Stations'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/stations')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Stations/>
}

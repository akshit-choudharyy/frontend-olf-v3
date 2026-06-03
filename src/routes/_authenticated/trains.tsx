import Trains from '@/components/modules/Stations/Trains'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/trains')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Trains/>
}

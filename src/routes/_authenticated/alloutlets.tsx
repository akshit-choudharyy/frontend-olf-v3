import Outlets from '@/components/modules/Outlets/Outlets'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/alloutlets')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlets stationcode={null}/>
}

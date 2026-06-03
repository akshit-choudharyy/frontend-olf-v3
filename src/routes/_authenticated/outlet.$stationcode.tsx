import Outlets from '@/components/modules/Outlets/Outlets'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outlet/$stationcode')({
  component: RouteComponent,
})

function RouteComponent() {
  // Get the stationcode parameter from the URL
  const { stationcode } = useParams({ from: '/_authenticated/outlet/$stationcode' })
  
  // Now you can pass the stationcode to your Outlets component if needed
  return <Outlets stationcode={stationcode} />
}
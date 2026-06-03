import Feedbacks from '@/components/modules/Feedbacks/Feedbacks'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/feedbacks/$outletid')({
  component: RouteComponent,
})

function RouteComponent() {
  const {outletid}= useParams({from:'/_authenticated/feedbacks/$outletid'});
  return <Feedbacks outletid ={outletid}/>
}

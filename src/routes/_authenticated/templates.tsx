import Templates from '@/components/modules/HR/Templates'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/templates')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Templates/>
}

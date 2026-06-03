import Departments from '@/components/modules/HR/Departments'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/departments')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Departments/>
}

import EmployeeManagement from '@/components/modules/HR/Employees/EmployeeManagment'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/employees')({
  component: RouteComponent,
})

function RouteComponent() {
  return <EmployeeManagement />
}

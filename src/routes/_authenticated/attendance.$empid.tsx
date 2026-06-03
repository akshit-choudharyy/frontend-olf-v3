import EmployeeAttendanceCalendar from '@/components/modules/HR/Employees/AttendenceCalender'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/attendance/$empid')({
  component: RouteComponent,
})

function RouteComponent() {
  const {empid} = useParams({ from: '/_authenticated/attendance/$empid' });
  return <EmployeeAttendanceCalendar empId={Number(empid)} />
}

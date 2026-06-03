import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/ratings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/ratings"!</div>
}

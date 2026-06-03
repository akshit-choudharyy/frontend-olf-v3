import AdminBlogsPage from '@/components/modules/Blogs/Blogs'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/blogs')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
        <AdminBlogsPage />
    </>
  )
}

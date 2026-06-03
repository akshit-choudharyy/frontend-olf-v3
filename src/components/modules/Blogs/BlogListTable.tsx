// components/admin/blogs/blog-list-table.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Blog } from "@/lib/types";

interface BlogListTableProps {
  blogs: Blog[];
}

export function BlogListTable({ blogs }: BlogListTableProps) {
  return (
    <Card>
     <CardHeader>
        <CardTitle>All Blogs</CardTitle>
        <CardDescription>A list of all blog posts in your database.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Published At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No blogs found. Create one to get started!
                </TableCell>
              </TableRow>
            ) : (
              blogs.map((blog) => (
                <TableRow key={blog.blog_id}>
                  <TableCell className="font-medium">{blog.title}</TableCell>
                  <TableCell>{blog.author}</TableCell>
                  <TableCell>
                    <Badge variant={
                        new Date(blog.published_at) <= new Date()
                          ? "default"
                          : "outline"
                      }>
                      {new Date(blog.published_at) <= new Date() ? "Published" : "Scheduled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(blog.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
       </CardContent>
    </Card>
  );
}
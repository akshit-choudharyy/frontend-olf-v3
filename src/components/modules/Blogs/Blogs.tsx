// app/admin/blogs/page.tsx
"use client";

import { useState } from "react";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Blog } from "@/lib/types";
import { BlogFormValues } from "@/lib/validators";
import { CreateBlogForm } from "./CreateBlogForm"; // Assuming this form can handle create/edit
import { olfService } from "@/utils/axiosInstance";

// Define the BlogListTable component within the same file for clarity
interface BlogListTableProps {
  blogs: Blog[];
  onView: (blog: Blog) => void;
  onEdit: (blog: Blog) => void;
  onDelete: (blog: Blog) => void;
}

function BlogListTable({ blogs, onView, onEdit, onDelete }: BlogListTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <TableRow key={blog.blog_id}>
                <TableCell className="font-medium">{blog.title}</TableCell>
                <TableCell>{blog.author || "N/A"}</TableCell>
                <TableCell>
                  {new Date(blog.published_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {/* View Action - now opens a modal */}
                      <DropdownMenuItem onClick={() => onView(blog)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      {/* Edit Action */}
                      <DropdownMenuItem onClick={() => onEdit(blog)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {/* Delete Action */}
                      <DropdownMenuItem
                        onClick={() => onDelete(blog)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No blogs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminBlogsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [deletingBlog, setDeletingBlog] = useState<Blog | null>(null);
  const [viewingBlog, setViewingBlog] = useState<Blog | null>(null);
  const queryClient = useQueryClient();

  // --- QUERIES & MUTATIONS ---

  const {
    isPending,
    error: queryError,
    data: blogs = [],
  } = useQuery<Blog[]>({
    queryKey: ['blogs'],
    queryFn: () =>
      olfService.get('/blogs').then((res) => {
        if (res.data.status !== 1) {
          throw new Error("Unexpected response status");
        }
        return (res.data.data.rows || []).sort(
          (a: Blog, b: Blog) => b.blog_id - a.blog_id
        );
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const createBlogMutation = useMutation({
    mutationFn: (newBlog: BlogFormValues) => olfService.post('/blog', newBlog),
    onSuccess: () => {
      toast.success("Blog created successfully!");
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create blog: ${error.message || 'An error occurred'}`);
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, ...updatedBlog }: { id: number } & BlogFormValues) =>
      olfService.put(`/blog/${id}`, updatedBlog),
    onSuccess: () => {
      toast.success("Blog updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      setEditingBlog(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update blog: ${error.message || 'An error occurred'}`);
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: number) => olfService.delete(`/blog/${id}`),
    onSuccess: () => {
      toast.success("Blog deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      setDeletingBlog(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete blog: ${error.message || 'An error occurred'}`);
    },
  });

  // --- RENDER ---

  return (
    <div className="container mx-auto p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Blogs</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Blog
        </Button>
      </div>

      {isPending && <p className="text-center">Loading blogs...</p>}
      {queryError && (
        <p className="text-center text-red-500">
          Error fetching blogs: {queryError.message}
        </p>
      )}
      {!isPending && !queryError && (
        <BlogListTable
          blogs={blogs}
          onView={(blog) => setViewingBlog(blog)}
          onEdit={(blog) => setEditingBlog(blog)}
          onDelete={(blog) => setDeletingBlog(blog)}
        />
      )}

      {/* --- DIALOGS --- */}

      {/* Create Blog Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>Create a New Blog Post</DialogTitle>
          </DialogHeader>
          <CreateBlogForm
            setOpen={setIsCreateModalOpen}
            onSubmit={createBlogMutation.mutate}
            isPending={createBlogMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Blog Dialog */}
      <Dialog open={!!editingBlog} onOpenChange={() => setEditingBlog(null)}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          {editingBlog && (
            <CreateBlogForm
              setOpen={() => setEditingBlog(null)}
              initialData={editingBlog}
              onSubmit={(values) => {
                updateBlogMutation.mutate({ id: editingBlog.blog_id, ...values });
              }}
              isPending={updateBlogMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Blog Dialog */}
      <Dialog open={!!viewingBlog} onOpenChange={() => setViewingBlog(null)}>
        <DialogContent className="sm:max-w-[725px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingBlog?.title}</DialogTitle>
            <DialogDescription>
              By {viewingBlog?.author || "N/A"} on{" "}
              {viewingBlog && new Date(viewingBlog.published_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {viewingBlog && (
            <div className="overflow-y-auto pr-4 -mr-4 flex-1">
              {/* MODIFICATION: Conditionally render the cover image */}
              {viewingBlog.cover && (
                <div className="mb-6">
                  <img
                    src={viewingBlog.cover}
                    alt={`Cover image for ${viewingBlog.title}`}
                    className="w-full h-auto object-cover rounded-md aspect-video"
                  />
                </div>
              )}
              {/* Using prose is ideal for styling HTML from a rich text editor.
                  Requires @tailwindcss/typography plugin. */}
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: viewingBlog.content }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingBlog}
        onOpenChange={() => setDeletingBlog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog
              post titled "{deletingBlog?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingBlog) {
                  deleteBlogMutation.mutate(deletingBlog.blog_id);
                }
              }}
              disabled={deleteBlogMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteBlogMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
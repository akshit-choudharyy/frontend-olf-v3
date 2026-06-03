"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { blogFormSchema, BlogFormValues } from "@/lib/validators";
import { Blog } from "@/lib/types"; // Import the main Blog type

// 1. Define a more robust props interface to handle both create and edit scenarios.
interface CreateBlogFormProps {
  setOpen: (open: boolean) => void;
  onSubmit: (values: BlogFormValues) => void; // Parent's submit handler
  isPending: boolean; // Loading state from the parent's mutation
  initialData?: Blog | null; // Optional data for pre-filling the form (for editing)
}

export function CreateBlogForm({
  setOpen,
  onSubmit,
  isPending,
  initialData,
}: CreateBlogFormProps) {
  // 2. Determine if we are in "edit" mode.
  const isEditing = !!initialData;

  // 3. Set default values based on whether we are creating or editing.
  // Note: API `published_at` is a string, but the form needs a Date object.
  const defaultValues = {
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    cover: initialData?.cover || "",
    author: initialData?.author || "",
    published_at: initialData ? new Date(initialData.published_at) : new Date(),
  };

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues,
  });

  // 4. The internal submit handler now simply calls the onSubmit prop.
  // The actual API call (create or update) is handled by the parent component.
  function handleFormSubmit(values: BlogFormValues) {
    onSubmit(values);
  }

  // 5. Removed internal useMutation and useQueryClient. This component is now presentation-only.

  return (
    <Form {...form}>
      {/* The `onSubmit` now calls our simplified handler */}
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4 overflow-scroll"
        style={{ maxHeight: "80vh" }}
      >
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Blog Post" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Slug */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="my-awesome-blog-post" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Cover Image URL */}
        <FormField
          control={form.control}
          name="cover"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  rows={10}
                  placeholder="Write your blog content here. You can use HTML for formatting."
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Author & Published At */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="published_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Published Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        field.value ? new Date(field.value) : undefined
                      }
                      onSelect={field.onChange}
                      // You can keep or remove this disabled logic
                      // disabled={(date) =>
                      //   date > new Date() || date < new Date("1900-01-01")
                      // }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {/* 6. Use the `isPending` prop and dynamic text for the submit button */}
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
              ? "Save Changes"
              : "Create Post"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
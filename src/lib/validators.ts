// lib/validators.ts
import { z } from "zod";

export const blogFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters long.",
  }),
  slug: z.string().min(3, {
    message: "Slug must be at least 3 characters long.",
  }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must be a valid URL-friendly string (e.g., 'my-new-post').",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters long.",
  }),
  cover: z.string().url({
    message: "Cover must be a valid URL.",
  }),
  author: z.string().min(2, {
    message: "Author name is required.",
  }),
  published_at: z.date({
    required_error: "A publication date is required.",
  }),
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;
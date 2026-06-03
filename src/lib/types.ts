export type Blog = {
  blog_id: number;
  title: string;
  slug: string;
  content: string;
  cover: string; // This will be a URL to the cover image
  author: string;
  published_at: Date; // Use Date object for easier handling in JS
};
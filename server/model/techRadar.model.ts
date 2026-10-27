import z from "zod";

export const techCategoryEnum = z.enum([
  "all",
  "ai",
  "web",
  "backend",
  "mobile",
  "tools",
  "general",
  "bookmarks",
]);

export const techRadarArticleSchema = z.object({
  article_id: z.string().min(1, "article_id is required"),
  title: z.string().min(1, "title is required"),
  url: z.string().url("url must be a valid URL"),
  source: z.string().min(1, "source is required"),
  category: z.string().optional(),
  author: z.string().optional(),
  published_at: z.string().optional(),
});

export type TechRadarArticleInput = z.infer<typeof techRadarArticleSchema>;

export const techRadarQuerySchema = z.object({
  category: techCategoryEnum.optional().default("all"),
  bookmarks_only: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === "true" || val === "1"),
  force_refresh: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === "true" || val === "1"),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export type TechRadarQueryInput = z.infer<typeof techRadarQuerySchema>;

export const techRadarBriefingSchema = z.object({
  force: z.boolean().optional().default(false),
});

export type TechRadarBriefingInput = z.infer<typeof techRadarBriefingSchema>;

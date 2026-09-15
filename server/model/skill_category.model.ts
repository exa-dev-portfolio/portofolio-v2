import z from "zod";

export const skillCategoryModel = z.object({
    id: z.number(),
    name: z.string().min(1).max(100),
    description: z.string().nullable().optional(),
    color: z.string().min(1).max(50).default('#38bdf8'),
    created_at: z.union([z.string(), z.date()]).optional(),
    updated_at: z.union([z.string(), z.date()]).optional(),
});

export type SkillCategoryModel = z.infer<typeof skillCategoryModel>;

export const createSkillCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required').max(100),
    description: z.string().nullable().optional(),
    color: z.string().min(1).max(50).default('#38bdf8'),
});

export type CreateSkillCategoryInput = z.infer<typeof createSkillCategorySchema>;

export const updateSkillCategorySchema = z.object({
    id: z.number(),
    name: z.string().min(1, 'Category name is required').max(100),
    description: z.string().nullable().optional(),
    color: z.string().min(1).max(50).default('#38bdf8'),
});

export type UpdateSkillCategoryInput = z.infer<typeof updateSkillCategorySchema>;

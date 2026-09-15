import z from "zod";

export const skillModel = z.object({
    id: z.number(),
    name: z.string().min(1).max(100),
    color: z.string().min(1).max(100),
    icon: z.string().min(1).max(100),
    category_id: z.number().nullable().optional(),
    category_name: z.string().nullable().optional(),
    category_color: z.string().nullable().optional(),
    created_at: z.union([z.string(), z.date()]).optional(),
})

export type SkillModel = z.infer<typeof skillModel>;

export const createSkill = z.object({
    name: z.string().min(1).max(100),
    color: z.string().min(1).max(100),
    icon: z.string().min(1).max(100),
    category_id: z.number().nullable().optional(),
});

export const createSkillSchema = z.object({
    data: z.array(createSkill).min(1),
});

export type CreateSkill = z.infer<typeof createSkill>;

export type CreateSkillsInput = CreateSkill[];

export const updateSkillSchema = z.object({
    name: z.string().min(1).max(100),
    color: z.string().min(1).max(100),
    icon: z.string().min(1).max(100),
    category_id: z.number().nullable().optional(),
    id: z.number(),
});

export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
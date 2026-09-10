import z from "zod";
import {fileSchema} from "~~/server/utils/common";

export const projectPreviewImageSchema = z.object({
    url: z.string(),
    title: z.string().max(255).optional().default(''),
    caption: z.string().max(1000).optional().default(''),
});

export type ProjectPreviewImage = z.infer<typeof projectPreviewImageSchema>;

export const previewItemMetadataSchema = z.object({
    url: z.string().optional(),
    title: z.string().optional(),
    caption: z.string().optional(),
    file_index: z.number().optional(),
});

export type PreviewItemMetadata = z.infer<typeof previewItemMetadataSchema>;

export const subAppSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(255),
    app_type: z.enum(["mobile", "web", "backend", "pos", "other"]).default("web"),
    description: z.string().max(2000).optional().default(""),
    repo_url: z.string().optional().default(""),
    live_url: z.string().optional().default(""),
    technologies: z.array(z.string()).optional().default([]),
});

export type SubApp = z.infer<typeof subAppSchema>;

export const subAppsFieldSchema = z.preprocess((val) => {
    if (typeof val === "string") {
        try {
            return JSON.parse(val);
        } catch {
            return [];
        }
    }
    return val;
}, z.array(subAppSchema).optional().default([]));

export const isOrganizationFieldSchema = z.preprocess((val) => {
    if (typeof val === "string") {
        return val.toLowerCase() === "true";
    }
    return Boolean(val);
}, z.boolean().default(false));

export const projectModel = z.object({
    id: z.number(),
    name: z.string().min(1).max(255),
    description: z.string().min(1).max(5000).optional(),
    start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {message: "Invalid date format"}).optional(),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }).optional(),
    status: z.enum(["Draft", "Published"]),
    preview_image: z.string(),
    preview_images: z.array(projectPreviewImageSchema).optional().default([]),
    features: z.array(z.string()),
    live_url: z.url().optional(),
    repo_url: z.url().optional(),
    is_organization: z.boolean().optional().default(false),
    github_org: z.string().nullable().optional(),
    sub_apps: z.array(subAppSchema).optional().default([]),
    skills: z.array(z.string()),
    id_skills: z.array(z.number()).optional(),
    created_at: z.string(),
    updated_at: z.string(),
})

export type ProjectModel = z.infer<typeof projectModel>;

export const createProjectSchema = z.object({
    name: z.string().min(1).max(255),
    image: fileSchema, // Max 5MB
    url: z.string().nullable().optional(),
    description: z.string().min(1).max(5000).optional(),
    start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {message: "Invalid date format"}).optional(),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }).optional(),
    status: z.boolean(),
    features: z.array(z.string()),
    id_skills: z.array(z.number()),
    live_url: z.string().nullable().optional(),
    repo_url: z.string().nullable().optional(),
    is_organization: isOrganizationFieldSchema,
    github_org: z.string().nullable().optional(),
    sub_apps: subAppsFieldSchema,
    preview_metadata: z.array(previewItemMetadataSchema).optional().default([]),
    preview_files: z.union([fileSchema, z.array(fileSchema)]).optional(),
    preview_images: z.array(projectPreviewImageSchema).optional().default([]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
    id: z.number(),
    name: z.string().min(1).max(255),
    image: fileSchema.optional(), // Max 5MB
    description: z.string().min(1).max(5000).optional(),
    start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {message: "Invalid date format"}).optional(),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }).optional(),
    status: z.boolean(),
    features: z.array(z.string()),
    url: z.string().nullable().optional(),
    live_url: z.string().nullable().optional(),
    id_skills: z.array(z.number()),
    repo_url: z.string().nullable().optional(),
    is_organization: isOrganizationFieldSchema,
    github_org: z.string().nullable().optional(),
    sub_apps: subAppsFieldSchema,
    preview_metadata: z.array(previewItemMetadataSchema).optional().default([]),
    preview_files: z.union([fileSchema, z.array(fileSchema)]).optional(),
    preview_images: z.array(projectPreviewImageSchema).optional().default([]),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
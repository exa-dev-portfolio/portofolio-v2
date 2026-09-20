import z from "zod";

export const userSettingsModel = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
    email: z.string().email(),
    location: z.string().max(255).nullable().optional(),
    open_to_opportunities: z.boolean(),
    job_notifications_enabled: z.boolean(),
    github_profile: z.string().max(255).nullable().optional(),
    linkedin_profile: z.string().max(255).nullable().optional(),
    apple_id: z.string().max(255).nullable().optional(),
    apple_email: z.string().max(255).nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    cv_url: z.string().url(),
})

export type UserSettingsModel = z.infer<typeof userSettingsModel>;

export const updateProfileSettingsSchema = z.object({
    name: z.string().min(1).max(255),
    location: z.string().max(255).optional().nullable(),
    open_to_opportunities: z.boolean(),
    job_notifications_enabled: z.boolean(),
});

export type UpdateProfileSettingsInput = z.infer<typeof updateProfileSettingsSchema>;

export const updateSocialLinksSchema = z.object({
    github_profile: z.string().max(255).optional().nullable(),
    linkedin_profile: z.string().max(255).optional().nullable(),
});

export type UpdateSocialLinksInput = z.infer<typeof updateSocialLinksSchema>;

export const bindAppleSchema = z.object({
    identityToken: z.string().min(1),
    email: z.string().optional().nullable(),
});

export type BindAppleInput = z.infer<typeof bindAppleSchema>;


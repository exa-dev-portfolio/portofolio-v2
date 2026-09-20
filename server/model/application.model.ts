import z from 'zod';

export const applicationModel = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    company_name: z.string().max(255),
    position: z.string().max(255),
    hr_email: z.string().max(255),
    job_description: z.string().nullable().optional(),
    job_link: z.string().max(500).nullable().optional(),
    email_subject: z.string().nullable().optional(),
    email_body: z.string().nullable().optional(),
    email_reasoning: z.string().nullable().optional(),
    chat_history: z.any().optional().nullable(),
    status: z.enum(['draft', 'sent']),
    sent_at: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type ApplicationModel = z.infer<typeof applicationModel>;

export const createApplicationSchema = z.object({
    company_name: z.string().min(1).max(255),
    position: z.string().min(1).max(255),
    hr_email: z.string().min(1).max(255),
    job_description: z.string().optional().nullable(),
    job_link: z.string().max(500).optional().nullable(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z.object({
    company_name: z.string().min(1).max(255).optional(),
    position: z.string().min(1).max(255).optional(),
    hr_email: z.string().min(1).max(255).optional(),
    job_description: z.string().optional().nullable(),
    job_link: z.string().max(500).optional().nullable(),
    email_subject: z.string().optional().nullable(),
    email_body: z.string().optional().nullable(),
    chat_history: z.any().optional().nullable(),
});

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export const generateEmailSchema = z.object({
    company_name: z.string().min(1).max(255),
    position: z.string().min(1).max(255),
    hr_email: z.string().min(1).max(255),
    job_description: z.string().min(1),
    job_link: z.string().max(500).optional().nullable(),
});

export type GenerateEmailInput = z.infer<typeof generateEmailSchema>;

export const chatSchema = z.object({
    application_id: z.string().uuid(),
    message: z.string().min(1),
});

export type ChatInput = z.infer<typeof chatSchema>;

export const attachmentModel = z.object({
    id: z.string().uuid(),
    application_id: z.string().uuid(),
    file_name: z.string().max(255),
    file_url: z.string(),
    file_size: z.number().nullable().optional(),
    mime_type: z.string().max(100).nullable().optional(),
    created_at: z.string(),
});

export type AttachmentModel = z.infer<typeof attachmentModel>;

export const gmailTokenModel = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    email: z.string().nullable().optional(),
    refresh_token: z.string().nullable().optional(),
    access_token: z.string().nullable().optional(),
    expires_at: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type GmailTokenModel = z.infer<typeof gmailTokenModel>;

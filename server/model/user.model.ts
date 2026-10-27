import z from 'zod';

export const userModel = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    email: z.string().email(),
    apple_id: z.string().nullable().optional(),
    apple_email: z.string().nullable().optional(),
})

export type UserModel = z.infer<typeof userModel>;

export const loginRequestModel = z.object({
    code: z.string().min(1),
})

export const appleLoginRequestModel = z.object({
    identityToken: z.string().min(1),
    email: z.string().optional().nullable(),
    name: z.any().optional().nullable(),
})

export type AppleLoginRequestModel = z.infer<typeof appleLoginRequestModel>;
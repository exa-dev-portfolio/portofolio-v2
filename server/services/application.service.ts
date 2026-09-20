import { logger } from '../utils/logger'
import * as repository from "~~/server/repositories/application.repository";
import {withTransaction} from "~~/server/db/postgres";
import {HttpError} from "~~/server/errors/HttpError";
import {sendSuccess} from "~~/server/utils/response";
import {generateEmail, reviseEmail} from "~~/server/lib/ai-apply";
import {sendEmail, fetchAttachmentBuffer, exchangeCodeForTokens} from "~~/server/lib/gmail";
import {getMinioClient} from "~~/server/lib/minio";
import {getUserSettings} from "~~/server/repositories/settings.repository";
import type {H3Event} from "h3";
import crypto from 'crypto';

export const create = async (event: H3Event, data: {
    company_name: string;
    position: string;
    hr_email: string;
    job_description?: string | null;
    job_link?: string | null;
}) => {
    const user = event.context.user;
    return withTransaction(async (client) => {
        const application = await repository.createApplication(client, user.id, data);
        return sendSuccess(event, application, 'Application created successfully', 'application_created', 201);
    });
};

export const findAll = async (event: H3Event) => {
    const user = event.context.user;
    return withTransaction(async (client) => {
        const applications = await repository.findAllApplications(client, user.id);
        return sendSuccess(event, applications, 'Applications retrieved successfully', 'applications_retrieved');
    });
};

export const findById = async (event: H3Event, id: string) => {
    const user = event.context.user;
    return withTransaction(async (client) => {
        const application = await repository.findApplicationById(client, id, user.id);
        if (!application) {
            throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found');
        }
        const attachments = await repository.findAttachmentsByApplicationId(client, id);
        return sendSuccess(event, {application, attachments}, 'Application retrieved successfully', 'application_retrieved');
    });
};

export const update = async (event: H3Event, id: string, data: any) => {
    const user = event.context.user;
    return withTransaction(async (client) => {
        const existing = await repository.findApplicationById(client, id, user.id);
        if (!existing) {
            throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found');
        }
        const application = await repository.updateApplication(client, id, user.id, data);
        return sendSuccess(event, application, 'Application updated successfully', 'application_updated');
    });
};

export const remove = async (event: H3Event, id: string) => {
    const user = event.context.user;
    return withTransaction(async (client) => {
        const ok = await repository.deleteApplication(client, id, user.id);
        if (!ok) {
            throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found');
        }
        return sendSuccess(event, null, 'Application deleted successfully', 'application_deleted');
    });
};

export const generate = async (event: H3Event, data: {
    company_name: string;
    position: string;
    hr_email: string;
    job_description: string;
    job_link?: string | null;
}) => {
    const user = event.context.user;
    const result = await generateEmail(user.id, data);

    return withTransaction(async (client) => {
        const application = await repository.createApplication(client, user.id, {
            company_name: data.company_name,
            position: data.position,
            hr_email: data.hr_email,
            job_description: data.job_description,
            job_link: data.job_link || null,
            email_subject: result.subject,
            email_body: result.body,
            email_reasoning: result.reasoning.join('\n'),
        });

        return sendSuccess(event, {
            application,
            subject: result.subject,
            body: result.body,
            reasoning: result.reasoning,
            analysis: result.analysis,
        }, 'Email generated successfully', 'email_generated');
    });
};

export const chat = async (event: H3Event, applicationId: string, message: string) => {
    const user = event.context.user;

    return withTransaction(async (client) => {
        const application = await repository.findApplicationById(client, applicationId, user.id);
        if (!application) {
            throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found');
        }

        let chatHistory: Array<{ role: string; content: string }> = [];
        if (application.chat_history) {
            if (Array.isArray(application.chat_history)) {
                chatHistory = [...application.chat_history];
            } else if (typeof application.chat_history === 'string') {
                try {
                    chatHistory = JSON.parse(application.chat_history);
                } catch {
                    chatHistory = [];
                }
            }
        }

        const result = await reviseEmail(
            user.id,
            application.email_subject || '',
            application.email_body || '',
            application.job_description || '',
            message,
            chatHistory
        );

        const updatedChatHistory = [
            ...chatHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: result.reply },
        ];

        const updates: any = {
            chat_history: JSON.stringify(updatedChatHistory),
        };
        if (result.revised_subject) updates.email_subject = result.revised_subject;
        if (result.revised_body) updates.email_body = result.revised_body;
        if (result.reasoning) updates.email_reasoning = result.reasoning.join('\n');

        await repository.updateApplication(client, applicationId, user.id, updates);

        return sendSuccess(event, {
            reply: result.reply,
            revised_subject: result.revised_subject || null,
            revised_body: result.revised_body || null,
            reasoning: result.reasoning || [],
            chat_history: updatedChatHistory,
        }, 'Chat response generated', 'chat_response');
    });
};

export const clearApplicationChat = async (event: H3Event, applicationId: string) => {
    const user = event.context.user;

    return withTransaction(async (client) => {
        const application = await repository.findApplicationById(client, applicationId, user.id);
        if (!application) {
            throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found');
        }

        await repository.updateApplication(client, applicationId, user.id, {
            chat_history: JSON.stringify([]),
        });

        return sendSuccess(event, { chat_history: [] }, 'Chat history cleared', 'chat_cleared');
    });
};

export const sendApplicationEmail = async (event: H3Event, applicationId: string, code?: string, attachCv: boolean = true) => {
    const user = event.context.user;

    return withTransaction(async (client) => {
        const application = await repository.findApplicationById(client, applicationId, user.id);
        if (!application) {
            throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found');
        }

        if (!application.email_subject || !application.email_body) {
            throw new HttpError(400, 'EMAIL_NOT_GENERATED', 'Email has not been generated yet');
        }

        if (application.status === 'sent') {
            throw new HttpError(400, 'ALREADY_SENT', 'This application has already been sent');
        }

        let fromEmail: string;
        let accessToken: string;

        const existingTokens = await repository.findGmailTokens(client, user.id);

        if (existingTokens?.refresh_token) {
            fromEmail = existingTokens.email || '';
            const {OAuth2Client} = await import('google-auth-library');
            const config = useRuntimeConfig();
            const oauth2 = new OAuth2Client({
                clientId: config.googleClientId as string,
                clientSecret: config.googleClientSecret as string,
            });
            oauth2.setCredentials({refresh_token: existingTokens.refresh_token});
            const {token} = await oauth2.getAccessToken();
            if (!token) {
                throw new HttpError(500, 'GMAIL_TOKEN_ERROR', 'Failed to get access token');
            }
            accessToken = token;
        } else if (code) {
            const tokenResult = await exchangeCodeForTokens(code);
            fromEmail = tokenResult.email;
            accessToken = tokenResult.access_token;

            await repository.upsertGmailTokens(client, user.id, {
                email: tokenResult.email,
                refresh_token: tokenResult.refresh_token,
                access_token: tokenResult.access_token,
                expires_at: tokenResult.expires_at.toISOString(),
            });
        } else {
            throw new HttpError(400, 'GMAIL_NOT_AUTHORIZED', 'Gmail authorization required. Please authorize Gmail to send this email.');
        }

        const attachmentList: Array<{
            filename: string;
            content: string;
            encoding: string;
            mimeType: string;
        }> = [];

        const settings = await getUserSettings(client);
        if (attachCv && settings?.cv_url) {
            try {
                const cvBuffer = await fetchAttachmentBuffer(settings.cv_url);
                attachmentList.push({
                    filename: 'CV.pdf',
                    content: cvBuffer.toString('base64'),
                    encoding: 'base64',
                    mimeType: 'application/pdf',
                });
            } catch (err) {
                logger.warn({ err: err }, '[Send] Failed to fetch CV:');
            }
        }

        const appAttachments = await repository.findAttachmentsByApplicationId(client, applicationId);
        for (const att of appAttachments) {
            try {
                const buffer = await fetchAttachmentBuffer(att.file_url);
                attachmentList.push({
                    filename: att.file_name,
                    content: buffer.toString('base64'),
                    encoding: 'base64',
                    mimeType: att.mime_type || 'application/octet-stream',
                });
            } catch (err) {
                logger.warn({ err: err }, `[Send] Failed to fetch attachment ${att.file_name}:`);
            }
        }

        await sendEmail(
            accessToken,
            fromEmail,
            application.hr_email,
            application.email_subject,
            application.email_body,
            attachmentList
        );

        await repository.updateApplication(client, applicationId, user.id, {
            status: 'sent',
            sent_at: new Date().toISOString(),
        });

        return sendSuccess(event, null, 'Email sent successfully', 'email_sent');
    });
};

export const uploadAttachment = async (event: H3Event, applicationId: string) => {
    const user = event.context.user;

    return withTransaction(async (client) => {
        const application = await repository.findApplicationById(client, applicationId, user.id);
        if (!application) {
            throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found');
        }

        const files = await readMultipartFormData(event);
        if (!files || files.length === 0) {
            throw new HttpError(400, 'NO_FILE', 'No file uploaded');
        }

        const fileData = files[0];
        if (!fileData || !fileData.filename || !fileData.data) {
            throw new HttpError(400, 'INVALID_FILE', 'Invalid file data');
        }

        const maxSize = 5 * 1024 * 1024;
        if (fileData.data.length > maxSize) {
            throw new HttpError(413, 'FILE_TOO_LARGE', 'File size must be less than 5MB');
        }

        const mimeType = fileData.type || 'application/octet-stream';
        const ext = fileData.filename.split('.').pop() || 'file';
        const key = `applications/${applicationId}/attachments/${crypto.randomUUID()}-${Date.now()}.${ext}`;

        const minio = getMinioClient();
        const url = await minio.uploadFile('project', key, fileData.data, mimeType);

        const attachment = await repository.createAttachment(client, {
            application_id: applicationId,
            file_name: fileData.filename,
            file_url: url,
            file_size: fileData.data.length,
            mime_type: mimeType,
        });

        return sendSuccess(event, attachment, 'Attachment uploaded successfully', 'attachment_uploaded', 201);
    });
};

export const deleteAttachment = async (event: H3Event, applicationId: string, attachmentId: string) => {
    const user = event.context.user;

    return withTransaction(async (client) => {
        const application = await repository.findApplicationById(client, applicationId, user.id);
        if (!application) {
            throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found');
        }

        const ok = await repository.deleteAttachment(client, attachmentId, applicationId);
        if (!ok) {
            throw new HttpError(404, 'ATTACHMENT_NOT_FOUND', 'Attachment not found');
        }

        return sendSuccess(event, null, 'Attachment deleted successfully', 'attachment_deleted');
    });
};

export const getAttachments = async (event: H3Event, applicationId: string) => {
    const user = event.context.user;

    return withTransaction(async (client) => {
        const application = await repository.findApplicationById(client, applicationId, user.id);
        if (!application) {
            throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Application not found');
        }

        const attachments = await repository.findAttachmentsByApplicationId(client, applicationId);
        return sendSuccess(event, attachments, 'Attachments retrieved successfully', 'attachments_retrieved');
    });
};

export const getStats = async (event: H3Event) => {
    const user = event.context.user;

    return withTransaction(async (client) => {
        const stats = await repository.getApplicationStats(client, user.id);
        return sendSuccess(event, stats, 'Stats retrieved successfully', 'stats_retrieved');
    });
};

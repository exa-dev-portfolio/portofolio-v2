import type {PoolClient} from "pg";
import type {ApplicationModel, AttachmentModel, GmailTokenModel} from "~~/server/model/application.model";

export const createApplication = async (
    client: PoolClient,
    userId: string,
    data: {
        company_name: string;
        position: string;
        hr_email: string;
        job_description?: string | null;
        job_link?: string | null;
        email_subject?: string | null;
        email_body?: string | null;
        email_reasoning?: string | null;
    }
): Promise<ApplicationModel> => {
    const sql = `
        INSERT INTO job_applications (user_id, company_name, position, hr_email, job_description, job_link, email_subject, email_body, email_reasoning)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;
    const values = [
        userId,
        data.company_name,
        data.position,
        data.hr_email,
        data.job_description || null,
        data.job_link || null,
        data.email_subject || null,
        data.email_body || null,
        data.email_reasoning || null,
    ];
    const result = await client.query<ApplicationModel>(sql, values);
    return result.rows[0];
};

export const findAllApplications = async (
    client: PoolClient,
    userId: string,
): Promise<ApplicationModel[]> => {
    const sql = `
        SELECT * FROM job_applications
        WHERE user_id = $1
        ORDER BY created_at DESC
    `;
    const result = await client.query<ApplicationModel>(sql, [userId]);
    return result.rows;
};

export const findApplicationById = async (
    client: PoolClient,
    id: string,
    userId: string,
): Promise<ApplicationModel | null> => {
    const sql = `
        SELECT * FROM job_applications
        WHERE id = $1 AND user_id = $2
    `;
    const result = await client.query<ApplicationModel>(sql, [id, userId]);
    return result.rows[0] || null;
};

export const updateApplication = async (
    client: PoolClient,
    id: string,
    userId: string,
    data: Partial<{
        company_name: string;
        position: string;
        hr_email: string;
        job_description: string | null;
        job_link: string | null;
        email_subject: string | null;
        email_body: string | null;
        email_reasoning: string | null;
        chat_history: any;
        status: string;
        sent_at: string;
    }>
): Promise<ApplicationModel | null> => {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            setClauses.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    if (setClauses.length === 0) return null;

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
        UPDATE job_applications
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
    `;
    values.push(id, userId);

    const result = await client.query<ApplicationModel>(sql, values);
    return result.rows[0] || null;
};

export const deleteApplication = async (
    client: PoolClient,
    id: string,
    userId: string,
): Promise<boolean> => {
    const sql = `DELETE FROM job_applications WHERE id = $1 AND user_id = $2`;
    const result = await client.query(sql, [id, userId]);
    return (result.rowCount ?? 0) > 0;
};

export const getApplicationStats = async (
    client: PoolClient,
    userId: string,
): Promise<{ total: number; draft: number; sent: number }> => {
    const sql = `
        SELECT 
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
            COUNT(*) FILTER (WHERE status = 'sent')::int AS sent
        FROM job_applications
        WHERE user_id = $1
    `;
    const result = await client.query(sql, [userId]);
    return result.rows[0] || {total: 0, draft: 0, sent: 0};
};

export const createAttachment = async (
    client: PoolClient,
    data: {
        application_id: string;
        file_name: string;
        file_url: string;
        file_size: number;
        mime_type: string;
    }
): Promise<AttachmentModel> => {
    const sql = `
        INSERT INTO application_attachments (application_id, file_name, file_url, file_size, mime_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const values = [data.application_id, data.file_name, data.file_url, data.file_size, data.mime_type];
    const result = await client.query<AttachmentModel>(sql, values);
    return result.rows[0];
};

export const findAttachmentsByApplicationId = async (
    client: PoolClient,
    applicationId: string,
): Promise<AttachmentModel[]> => {
    const sql = `
        SELECT * FROM application_attachments
        WHERE application_id = $1
        ORDER BY created_at ASC
    `;
    const result = await client.query<AttachmentModel>(sql, [applicationId]);
    return result.rows;
};

export const deleteAttachment = async (
    client: PoolClient,
    id: string,
    applicationId: string,
): Promise<boolean> => {
    const sql = `DELETE FROM application_attachments WHERE id = $1 AND application_id = $2`;
    const result = await client.query(sql, [id, applicationId]);
    return (result.rowCount ?? 0) > 0;
};

export const findGmailTokens = async (
    client: PoolClient,
    userId: string,
): Promise<GmailTokenModel | null> => {
    const sql = `SELECT * FROM gmail_tokens WHERE user_id = $1`;
    const result = await client.query<GmailTokenModel>(sql, [userId]);
    return result.rows[0] || null;
};

export const upsertGmailTokens = async (
    client: PoolClient,
    userId: string,
    data: {
        email?: string | null;
        refresh_token?: string | null;
        access_token?: string | null;
        expires_at?: string | null;
    }
): Promise<GmailTokenModel> => {
    const sql = `
        INSERT INTO gmail_tokens (user_id, email, refresh_token, access_token, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id)
        DO UPDATE SET 
            email = COALESCE($2, gmail_tokens.email),
            refresh_token = COALESCE($3, gmail_tokens.refresh_token),
            access_token = COALESCE($4, gmail_tokens.access_token),
            expires_at = COALESCE($5, gmail_tokens.expires_at),
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `;
    const values = [userId, data.email || null, data.refresh_token || null, data.access_token || null, data.expires_at || null];
    const result = await client.query<GmailTokenModel>(sql, values);
    return result.rows[0];
};

export const deleteGmailTokens = async (
    client: PoolClient,
    userId: string,
): Promise<boolean> => {
    const sql = `DELETE FROM gmail_tokens WHERE user_id = $1`;
    const result = await client.query(sql, [userId]);
    return (result.rowCount ?? 0) > 0;
};

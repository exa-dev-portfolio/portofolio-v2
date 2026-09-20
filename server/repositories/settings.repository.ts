import {PoolClient} from "pg";
import {UpdateProfileSettingsInput, UpdateSocialLinksInput, UserSettingsModel} from "~~/server/model/settings.model";

export const getUserSettings = async (
    client: PoolClient,
): Promise<UserSettingsModel | null> => {
    const sql = `
        SELECT id,
               name,
               email,
               location,
               open_to_opportunities,
               job_notifications_enabled,
               github_profile,
               linkedin_profile,
               apple_id,
               apple_email,
               created_at,
               cv_url,
               updated_at
        FROM users
    `

    const result = await client.query<UserSettingsModel>(sql)
    return result.rows[0] || null
}

export const updateProfileSettings = async (
    client: PoolClient,
    data: UpdateProfileSettingsInput
): Promise<boolean> => {
    const sql = `
        UPDATE users
        SET name                  = $1,
            location              = $2,
            open_to_opportunities = $3,
            job_notifications_enabled = $4,
            updated_at            = CURRENT_TIMESTAMP
    `
    const values = [
        data.name,
        data.location || null,
        data.open_to_opportunities,
        data.job_notifications_enabled,
    ]

    const result = await client.query(sql, values)
    return (result.rowCount ?? 0) > 0
}

export const updateSocialLinks = async (
    client: PoolClient,
    data: UpdateSocialLinksInput
): Promise<boolean> => {
    const sql = `
        UPDATE users
        SET github_profile   = $1,
            linkedin_profile = $2,
            updated_at       = CURRENT_TIMESTAMP
    `
    const values = [
        data.github_profile || null,
        data.linkedin_profile || null,
    ]

    const result = await client.query(sql, values)
    return (result.rowCount ?? 0) > 0
}

export const updateUserCV = async (
    client: PoolClient,
    cvUrl: string
): Promise<boolean> => {
    const sql = `
        UPDATE users
        SET cv_url     = $1,
            updated_at = CURRENT_TIMESTAMP
    `
    const values = [
        cvUrl,
    ]

    const result = await client.query(sql, values)
    return (result.rowCount ?? 0) > 0
}

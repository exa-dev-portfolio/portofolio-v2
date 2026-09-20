import type {PoolClient} from "pg";
import type {UserModel} from "~~/server/model/user.model";

export const getUserByEmail = async (client: PoolClient, email: string): Promise<UserModel | null> => {
    const query = `
        SELECT id, email, name, apple_id, apple_email
        FROM users
        WHERE email = $1 LIMIT 1
    `;
    const values = [email];

    const res = await client.query<UserModel>(query, values);
    if (res.rows.length === 0) {
        return null;
    }
    return res.rows[0] || null;
}

export const getUserByAppleId = async (client: PoolClient, appleId: string): Promise<UserModel | null> => {
    const query = `
        SELECT id, email, name, apple_id, apple_email
        FROM users
        WHERE apple_id = $1 LIMIT 1
    `;
    const values = [appleId];

    const res = await client.query<UserModel>(query, values);
    if (res.rows.length === 0) {
        return null;
    }
    return res.rows[0] || null;
}

export const getUserById = async (client: PoolClient, id: string): Promise<UserModel | null> => {
    const query = `
        SELECT id, email, name, apple_id, apple_email
        FROM users
        WHERE id = $1 LIMIT 1
    `;
    const values = [id];

    const res = await client.query<UserModel>(query, values);
    if (res.rows.length === 0) {
        return null;
    }
    return res.rows[0] || null;
}

export const linkAppleId = async (
    client: PoolClient,
    userId: string,
    appleId: string,
    appleEmail?: string | null
): Promise<boolean> => {
    const query = `
        UPDATE users
        SET apple_id = $1,
            apple_email = COALESCE($2, apple_email),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
    `;
    const values = [appleId, appleEmail || null, userId];
    const res = await client.query(query, values);
    return (res.rowCount ?? 0) > 0;
}

export const unlinkAppleId = async (client: PoolClient, userId: string): Promise<boolean> => {
    const query = `
        UPDATE users
        SET apple_id = NULL,
            apple_email = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `;
    const values = [userId];
    const res = await client.query(query, values);
    return (res.rowCount ?? 0) > 0;
}


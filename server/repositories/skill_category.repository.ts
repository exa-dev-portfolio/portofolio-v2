import { PoolClient } from "pg";
import { CreateSkillCategoryInput, SkillCategoryModel, UpdateSkillCategoryInput } from "~~/server/model/skill_category.model";

export const getAllSkillCategories = async (client: PoolClient): Promise<SkillCategoryModel[]> => {
    const sql = `
        SELECT sc.id, sc.name, sc.description, sc.color, sc.created_at, sc.updated_at,
               COUNT(s.id)::int AS skills_count
        FROM skill_categories sc
        LEFT JOIN skills s ON sc.id = s.category_id
        GROUP BY sc.id
        ORDER BY sc.name ASC
    `;
    const result = await client.query(sql);
    return result.rows;
};

export const getSkillCategoryById = async (client: PoolClient, id: number): Promise<SkillCategoryModel | null> => {
    const sql = `
        SELECT id, name, description, color, created_at, updated_at
        FROM skill_categories
        WHERE id = $1
    `;
    const result = await client.query<SkillCategoryModel>(sql, [id]);
    return result.rows[0] ?? null;
};

export const createSkillCategory = async (
    client: PoolClient,
    data: CreateSkillCategoryInput
): Promise<SkillCategoryModel> => {
    const sql = `
        INSERT INTO skill_categories (name, description, color)
        VALUES ($1, $2, $3)
        RETURNING id, name, description, color, created_at, updated_at
    `;
    const result = await client.query<SkillCategoryModel>(sql, [
        data.name,
        data.description || null,
        data.color || '#38bdf8'
    ]);
    return result.rows[0];
};

export const updateSkillCategory = async (
    client: PoolClient,
    id: number,
    data: UpdateSkillCategoryInput
): Promise<boolean> => {
    const sql = `
        UPDATE skill_categories
        SET name = $1,
            description = $2,
            color = $3,
            updated_at = current_timestamp
        WHERE id = $4
    `;
    const result = await client.query(sql, [
        data.name,
        data.description || null,
        data.color || '#38bdf8',
        id
    ]);
    return (result.rowCount ?? 0) > 0;
};

export const deleteSkillCategory = async (client: PoolClient, id: number): Promise<boolean> => {
    const sql = `
        DELETE FROM skill_categories
        WHERE id = $1
    `;
    const result = await client.query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
};

import {CreateSkillsInput, SkillModel, UpdateSkillInput} from "~~/server/model/skill.model";
import {PoolClient} from "pg";

export const createSkillsBulk = async (
    client: PoolClient,
    data: CreateSkillsInput
): Promise<number> => {
    if (data.length === 0) return 0

    const values: any[] = []
    const placeholders: string[] = []

    data.forEach((item, index) => {
        const baseIndex = index * 4
        placeholders.push(
            `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`
        )
        values.push(item.name, item.color, item.icon, item.category_id || null)
    })

    const sql = `
        INSERT INTO skills (name, color, icon, category_id)
        VALUES ${placeholders.join(', ')}
    `

    const result = await client.query(sql, values)
    return result.rowCount ?? 0
}

export const updateSkill = async (
    client: PoolClient,
    id: number,
    data: UpdateSkillInput
): Promise<boolean> => {
    const sql = `
        UPDATE skills
        SET name = $1,
            color = $2,
            icon = $3,
            category_id = $4,
            updated_at = current_timestamp
        WHERE id = $5
    `
    const values = [data.name, data.color, data.icon, data.category_id || null, id]

    const result = await client.query(sql, values)
    return (result.rowCount ?? 0) > 0
}

export const deleteSkill = async (
    client: PoolClient,
    id: number
): Promise<boolean> => {
    const sql = `
        DELETE
        FROM skills
        WHERE id = $1
    `
    const values = [id]

    const result = await client.query(sql, values)
    return (result.rowCount ?? 0) > 0
}

export const getSkillCursorPagination = async (
    client: PoolClient,
    limit: number,
    search?: string,
    cursor?: number,
    categoryId?: number,
    categoryName?: string
): Promise<SkillModel[]> => {
    let sql = `
        SELECT s.id, s.name, s.color, s.icon, s.category_id,
               sc.name AS category_name, sc.color AS category_color, s.created_at
        FROM skills s
        LEFT JOIN skill_categories sc ON s.category_id = sc.id
    `
    const whereConditions: string[] = []
    const values: any[] = []

    if (cursor) {
        values.push(cursor)
        whereConditions.push(`s.id > $${values.length}`)
    }

    if (search && search.trim() !== '') {
        values.push(`%${search.trim()}%`)
        whereConditions.push(`s.name ILIKE $${values.length}`)
    }

    if (categoryId) {
        values.push(categoryId)
        whereConditions.push(`s.category_id = $${values.length}`)
    } else if (categoryName && categoryName !== 'All') {
        values.push(categoryName)
        whereConditions.push(`sc.name ILIKE $${values.length}`)
    }

    if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`
    }

    values.push(limit)
    sql += ` ORDER BY s.id ASC LIMIT $${values.length}`

    const result = await client.query<SkillModel>(sql, values)
    return result.rows
}

export const getAllSkills = async (
    client: PoolClient,
    categoryId?: number,
    categoryName?: string
): Promise<SkillModel[]> => {
    let sql = `
        SELECT s.id, s.name, s.color, s.icon, s.category_id,
               sc.name AS category_name, sc.color AS category_color, s.created_at
        FROM skills s
        LEFT JOIN skill_categories sc ON s.category_id = sc.id
    `
    const whereConditions: string[] = []
    const values: any[] = []

    if (categoryId) {
        values.push(categoryId)
        whereConditions.push(`s.category_id = $${values.length}`)
    } else if (categoryName && categoryName !== 'All') {
        values.push(categoryName)
        whereConditions.push(`sc.name ILIKE $${values.length}`)
    }

    if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`
    }

    sql += ` ORDER BY s.name ASC`

    const result = await client.query<SkillModel>(sql, values)
    return result.rows
}

export const getSkillById = async (
    client: PoolClient,
    id: number
): Promise<SkillModel | null> => {
    const sql = `
        SELECT s.id, s.name, s.color, s.icon, s.category_id,
               sc.name AS category_name, sc.color AS category_color, s.created_at
        FROM skills s
        LEFT JOIN skill_categories sc ON s.category_id = sc.id
        WHERE s.id = $1
    `
    const values = [id]

    const result = await client.query<SkillModel>(sql, values)
    return result.rows[0] ?? null
}

import type {PoolClient} from "pg";
import type {CreateProjectInput, ProjectModel, UpdateProjectInput} from "~~/server/model/project.model";

export const createProject = async (
    client: PoolClient,
    data: CreateProjectInput
): Promise<number | undefined> => {
    const sql = `
        INSERT INTO projects ( name, image, description, start_date, end_date, status, features, live_url
                             , repo_url, preview_images, is_organization, github_org, sub_apps)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id
    `
    const values = [
        data.name,
        data.url,
        data.description,
        data.start_date,
        data.end_date,
        data.status,
        data.features,
        data.live_url,
        data.repo_url,
        JSON.stringify(data.preview_images || []),
        Boolean(data.is_organization),
        data.github_org || null,
        JSON.stringify(data.sub_apps || []),
    ]

    const result = await client.query<Partial<ProjectModel>>(sql, values)
    return result.rows[0]?.id
}

export const updateProject = async (
    client: PoolClient,
    data: UpdateProjectInput
): Promise<boolean> => {
    const sql = `
        UPDATE projects
        SET name            = $1,
            image           = $2,
            description     = $3,
            start_date      = $4,
            end_date        = $5,
            status          = $6,
            features        = $7,
            live_url        = $8,
            repo_url        = $9,
            preview_images  = $10,
            is_organization = $11,
            github_org      = $12,
            sub_apps        = $13
        WHERE id = $14
    `
    const values = [
        data.name,
        data.url,
        data.description,
        data.start_date,
        data.end_date,
        data.status,
        data.features,
        data.live_url,
        data.repo_url,
        JSON.stringify(data.preview_images || []),
        Boolean(data.is_organization),
        data.github_org || null,
        JSON.stringify(data.sub_apps || []),
        data.id,
    ]
    const result = await client.query(sql, values)
    return (result.rowCount ?? 0) > 0
}

export const deleteProject = async (
    client: PoolClient,
    id: number
): Promise<boolean> => {
    const sql = `
        DELETE
        FROM projects
        WHERE id = $1
    `
    const values = [id]

    const result = await client.query(sql, values)
    return (result.rowCount ?? 0) > 0
}

export const getProjectById = async (
    client: PoolClient,
    id: number
): Promise<ProjectModel | null> => {
    const sql = `
        SELECT p.id,
               p.name,
               p.image           AS preview_image,
               p.preview_images,
               p.description,
               p.start_date,
               p.end_date,
               p.status,
               p.features,
               p.live_url,
               p.repo_url,
               p.is_organization,
               p.github_org,
               p.sub_apps,
               p.created_at,
               ARRAY_AGG(s.name) AS technologies,
               ARRAY_AGG(s.id)   AS id_skills
        FROM projects p
                 JOIN project_skills ps ON p.id = ps.project_id
                 JOIN skills s ON ps.skill_id = s.id
        WHERE p.id = $1
        GROUP BY p.id
    `
    const values = [id]

    const result = await client.query(sql, values)
    return result.rows[0] || null
}

export const getProjectCursorPagination = async (
    client: PoolClient,
    limit: number,
    search?: string,
    cursor?: number,
    status?: boolean
): Promise<ProjectModel[]> => {
    let sql = `
        SELECT p.id,
               p.name,
               p.image           AS preview_image,
               p.preview_images,
               p.description,
               p.start_date,
               p.end_date,
               p.status,
               p.features,
               p.live_url,
               p.repo_url,
               p.is_organization,
               p.github_org,
               p.sub_apps,
               p.created_at,
               p.updated_at,
               ARRAY_AGG(s.name) AS technologies
        FROM projects p
                 JOIN project_skills ps ON ps.project_id = p.id
                 JOIN skills s ON s.id = ps.skill_id
    `
    const values: any[] = []
    const conditions: string[] = []

    if (cursor) {
        values.push(cursor)
        conditions.push(`p.id > $${values.length}`)
    }
    if (search) {
        values.push(`%${search}%`)
        conditions.push(`p.name ILIKE $${values.length}`)
    }
    if (status !== undefined) {
        values.push(status)
        conditions.push(`p.status = $${values.length}`)
    }

    if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ')
    }

    values.push(limit)
    sql += `
    GROUP BY p.id       
     ORDER BY p.id ASC LIMIT $${values.length}
     `

    const result = await client.query(sql, values)
    return result.rows
}

export const getAllProjects = async (
    client: PoolClient,
    status?: boolean
): Promise<ProjectModel[]> => {
    let sql = `
        SELECT p.id,
               p.name,
               p.image           AS preview_image,
               p.preview_images,
               p.description,
               p.start_date,
               p.end_date,
               p.status,
               p.features,
               p.live_url,
               p.repo_url,
               p.is_organization,
               p.github_org,
               p.sub_apps,
               p.created_at,
               p.updated_at,
               ARRAY_AGG(s.name) AS technologies
        FROM projects p
                 JOIN project_skills ps on p.id = ps.project_id
                 JOIN skills s on ps.skill_id = s.id
    `
    const values: any[] = []
    if (status !== undefined) {
        values.push(status)
        sql += ` WHERE p.status = $1`
    }

    sql += `
        GROUP BY p.id
        ORDER BY p.name ASC
    `
    const result = await client.query(sql, values)
    return result.rows
}


export const createProjectSkillRelation = async (
    client: PoolClient,
    projectId: number,
    skillId: number[]
): Promise<boolean> => {
    const values: any[] = []
    const placeholders: string[] = []
    skillId.forEach((id, index) => {
        const baseIndex = index * 2
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2})`)
        values.push(projectId, id)
    })

    const sql = `
        INSERT INTO project_skills (project_id, skill_id)
        VALUES ${placeholders.join(', ')}
    `

    const result = await client.query(sql, values)
    return (result.rowCount ?? 0) > 0

}

export const deleteProjectSkillRelation = async (
    client: PoolClient,
    projectId: number,
): Promise<boolean> => {
    const sql = `
        DELETE
        FROM project_skills
        WHERE project_id = $1
    `
    const values = [projectId,]

    const result = await client.query(sql, values)
    return (result.rowCount ?? 0) > 0
}
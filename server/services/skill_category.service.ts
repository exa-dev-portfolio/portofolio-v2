import { H3Event } from "h3";
import { CreateSkillCategoryInput, UpdateSkillCategoryInput } from "~~/server/model/skill_category.model";
import { withTransaction } from "~~/server/db/postgres";
import * as repository from "~~/server/repositories/skill_category.repository";
import { HttpError } from "~~/server/errors/HttpError";
import { get, set, del } from "~~/server/db/redis";
import { sendSuccess } from "~~/server/utils/response";

export const getSkillCategories = async (event: H3Event) => {
    return withTransaction(async (client) => {
        const cached = await get('skill_categories:all');
        if (cached) {
            const categories = JSON.parse(cached);
            return sendSuccess(event, { data: categories }, "Skill categories retrieved successfully", "skill_categories_retrieved");
        }

        const categories = await repository.getAllSkillCategories(client);
        await set('skill_categories:all', JSON.stringify(categories));

        return sendSuccess(event, { data: categories }, "Skill categories retrieved successfully", "skill_categories_retrieved");
    });
};

export const createSkillCategory = async (event: H3Event, body: CreateSkillCategoryInput) => {
    return withTransaction(async (client) => {
        try {
            const newCategory = await repository.createSkillCategory(client, body);
            // Invalidate caches
            await del('skill_categories:all');
            await del('skills:all');

            return sendSuccess(
                event,
                { data: newCategory },
                "Skill category created successfully",
                "skill_category_created",
                201
            );
        } catch (err: any) {
            if (err?.code === '23505') {
                throw new HttpError(409, 'CATEGORY_ALREADY_EXISTS', `Skill category '${body.name}' already exists`);
            }
            throw err;
        }
    });
};

export const updateSkillCategory = async (event: H3Event, body: UpdateSkillCategoryInput) => {
    return withTransaction(async (client) => {
        const existing = await repository.getSkillCategoryById(client, body.id);
        if (!existing) {
            throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Skill category not found');
        }

        try {
            const ok = await repository.updateSkillCategory(client, body.id, body);
            if (!ok) {
                throw new HttpError(500, 'UPDATE_FAILED', 'Failed to update skill category');
            }

            // Invalidate caches
            await del('skill_categories:all');
            await del('skills:all');

            return sendSuccess(event, null, "Skill category updated successfully", "skill_category_updated");
        } catch (err: any) {
            if (err?.code === '23505') {
                throw new HttpError(409, 'CATEGORY_ALREADY_EXISTS', `Skill category '${body.name}' already exists`);
            }
            throw err;
        }
    });
};

export const deleteSkillCategory = async (event: H3Event, id: number) => {
    return withTransaction(async (client) => {
        const existing = await repository.getSkillCategoryById(client, id);
        if (!existing) {
            throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Skill category not found');
        }

        const ok = await repository.deleteSkillCategory(client, id);
        if (!ok) {
            throw new HttpError(500, 'DELETE_FAILED', 'Failed to delete skill category');
        }

        // Invalidate caches
        await del('skill_categories:all');
        await del('skills:all');

        return sendSuccess(event, null, "Skill category deleted successfully", "skill_category_deleted");
    });
};

import { HttpError } from "~~/server/errors/HttpError";
import { updateSkillCategorySchema } from "~~/server/model/skill_category.model";
import { updateSkillCategory } from "~~/server/services/skill_category.service";
import z from "zod";

export default withAuth(async (event) => {
    const parsed = await readValidatedBody(event, body => updateSkillCategorySchema.safeParse(body));

    if (!parsed.success) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid category data', z.treeifyError(parsed.error).properties);
    }

    return await updateSkillCategory(event, parsed.data);
});

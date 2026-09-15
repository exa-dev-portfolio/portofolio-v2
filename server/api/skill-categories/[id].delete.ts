import z from "zod";
import { HttpError } from "~~/server/errors/HttpError";
import { deleteSkillCategory } from "~~/server/services/skill_category.service";

export default withAuth(async (event) => {
    const rawId = getRouterParam(event, 'id');

    const ok = z.string().refine(
        (val) => !isNaN(Number(val)) && Number(val) > 0,
        { message: 'ID must be a positive number' }
    ).transform((val) => Number(val)).safeParse(rawId);

    if (!ok.success) {
        throw new HttpError(400, 'INVALID_ID', 'The provided ID is not a valid number.');
    }

    const categoryId = ok.data;
    return await deleteSkillCategory(event, categoryId);
});

import { getSkillCategories } from "~~/server/services/skill_category.service";
import { handleError } from "~~/server/utils/handleError";

export default handleError(async (event) => {
    return await getSkillCategories(event);
});

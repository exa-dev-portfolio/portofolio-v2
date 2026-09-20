import {withAuth} from "~~/server/utils/withAuth";
import {HttpError} from "~~/server/errors/HttpError";
import {clearApplicationChat} from "~~/server/services/application.service";
import z from "zod";

const clearChatSchema = z.object({
    application_id: z.string().min(1),
});

export default withAuth(async (event) => {
    const body = await readBody(event);
    const parsed = clearChatSchema.safeParse(body);

    if (!parsed.success) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid request data', z.treeifyError(parsed.error).properties);
    }

    return await clearApplicationChat(event, parsed.data.application_id);
});

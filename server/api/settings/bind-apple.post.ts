import {HttpError} from "~~/server/errors/HttpError";
import {bindAppleSchema} from "~~/server/model/settings.model";
import {bindAppleToUser} from "~~/server/services/settings.service";
import {withAuth} from "~~/server/utils/withAuth";
import z from "zod";

export default withAuth(async (event) => {
    const parsed = await readValidatedBody(event, body => bindAppleSchema.safeParse(body));

    if (!parsed.success) {
        const errors = z.treeifyError(parsed.error);
        throw new HttpError(400, 'INVALID_INPUT', 'The request body is invalid', errors);
    }

    return await bindAppleToUser(event, parsed.data);
});

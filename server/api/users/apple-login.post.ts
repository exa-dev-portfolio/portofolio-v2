import {appleLoginRequestModel} from "~~/server/model/user.model";
import {HttpError} from "~~/server/errors/HttpError";
import z from "zod";
import {loginWithApple} from "~~/server/services/user.service";
import {handleError} from "~~/server/utils/handleError";

export default handleError(async (event) => {
    const parsed = await readValidatedBody(event, body => appleLoginRequestModel.safeParse(body));

    if (!parsed.success) {
        throw new HttpError(400, 'INVALID_REQUEST', 'Invalid request body', z.treeifyError(parsed.error).properties);
    }

    return await loginWithApple(event, parsed.data.identityToken, parsed.data.email, parsed.data.name);
});

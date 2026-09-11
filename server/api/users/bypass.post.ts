import {HttpError} from "~~/server/errors/HttpError";
import {loginByEmail} from "~~/server/services/user.service";
import {handleError} from "~~/server/utils/handleError";
import {useServerConfig} from "~~/server/utils/config";

const Config = useServerConfig();

export default handleError(async (event) => {
    if (Config.mode !== 'development') {
        throw new HttpError(403, 'FORBIDDEN', 'Bypass login is only allowed in development mode');
    }

    const body = await readBody(event);
    if (!body || typeof body !== 'object') {
        throw new HttpError(400, 'INVALID_REQUEST', 'Request body is required');
    }

    if (!body.email) {
        throw new HttpError(400, 'INVALID_REQUEST', 'Email is required for bypass login');
    }

    return await loginByEmail(event, body.email)
});

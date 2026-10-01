import {paginationSchemaQuery} from "~~/server/utils/common";
import {HttpError} from "~~/server/errors/HttpError";

import z from "zod";
import {getProjectsByCursor, getProjectsNoPagination} from "~~/server/services/project.service";
import {handleError} from "~~/server/utils/handleError";

export default handleError(async (event) => {
    const parsed = await getValidatedQuery(event, query => paginationSchemaQuery.extend({
        search: z.string().optional(),
        status: z.preprocess((val) => {
            if (val === undefined || val === null || val === '') return undefined;
            if (val === 'true' || val === true) return 'published';
            if (val === 'false' || val === false) return 'draft';
            const lower = String(val).toLowerCase();
            if (['draft', 'published', 'archived'].includes(lower)) return lower;
            return undefined;
        }, z.enum(['draft', 'published', 'archived']).optional())
    }).safeParse(query));

    if (!parsed.success) {
        throw new HttpError(400, 'INVALID_QUERY', 'The query parameters are invalid');
    }

    const query = parsed.data


    if (!query.pagination) {
        return await getProjectsNoPagination(event, query.status)
    }

    const limit = query.limit ? query.limit : 10
    const cursor = query.cursor ? query.cursor : undefined
    const search = query.search ? query.search : undefined

    return await getProjectsByCursor(event, limit, cursor, search, query.status)
})
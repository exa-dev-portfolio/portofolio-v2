import { withAuth } from "~~/server/utils/withAuth";
import { sendSuccess } from "~~/server/utils/response";
import { getUserTechRadar } from "~~/server/services/techNews.service";
import { techRadarQuerySchema } from "~~/server/model/techRadar.model";
import { HttpError } from "~~/server/errors/HttpError";
import z from "zod";

export default withAuth(async (event) => {
  const parsed = await getValidatedQuery(event, (query) =>
    techRadarQuerySchema.safeParse(query)
  );

  if (!parsed.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid query parameters",
      z.treeifyError(parsed.error).properties
    );
  }

  const query = parsed.data;
  const userId = event.context.user?.id;

  const data = await getUserTechRadar(userId, {
    category: query.category,
    bookmarksOnly: query.bookmarks_only,
    forceRefresh: query.force_refresh,
    limit: query.limit,
  });

  return sendSuccess(event, data);
});

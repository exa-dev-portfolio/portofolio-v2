import { withAuth } from "~~/server/utils/withAuth";
import { sendSuccess } from "~~/server/utils/response";
import { getUserTechRadar } from "~~/server/services/techNews.service";
import type { TechCategory } from "~~/app/types/tech-news";

export default withAuth(async (event) => {
  const query = getQuery(event);
  const userId = event.context.user?.id;

  const category = (query.category as TechCategory) || "all";
  const bookmarksOnly = query.bookmarks_only === "true" || query.bookmarks_only === "1";
  const forceRefresh = query.force_refresh === "true" || query.force_refresh === "1";
  const limit = query.limit ? Number(query.limit) : undefined;

  const data = await getUserTechRadar(userId, {
    category,
    bookmarksOnly,
    forceRefresh,
    limit,
  });

  return sendSuccess(event, data);
});

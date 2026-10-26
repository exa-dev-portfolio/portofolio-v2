import { withAuth } from "~~/server/utils/withAuth";
import { sendSuccess } from "~~/server/utils/response";
import { markArticleAsRead } from "~~/server/repositories/techRadar.repository";
import { HttpError } from "~~/server/errors/HttpError";

export default withAuth(async (event) => {
  const userId = event.context.user?.id;
  const body = await readBody(event);

  if (!body?.article_id || !body?.title || !body?.url || !body?.source) {
    throw new HttpError(400, "BAD_REQUEST", "Missing required article fields.");
  }

  const success = await markArticleAsRead(userId, {
    article_id: String(body.article_id),
    title: String(body.title),
    url: String(body.url),
    source: String(body.source),
    category: body.category ? String(body.category) : undefined,
    author: body.author ? String(body.author) : undefined,
    published_at: body.published_at ? String(body.published_at) : undefined,
  });

  return sendSuccess(event, { marked_as_read: success });
});

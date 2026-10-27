import { withAuth } from "~~/server/utils/withAuth";
import { sendSuccess } from "~~/server/utils/response";
import { markArticleAsRead } from "~~/server/repositories/techRadar.repository";
import { techRadarArticleSchema } from "~~/server/model/techRadar.model";
import { HttpError } from "~~/server/errors/HttpError";
import z from "zod";

export default withAuth(async (event) => {
  const parsed = await readValidatedBody(event, (body) =>
    techRadarArticleSchema.safeParse(body)
  );

  if (!parsed.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid request data",
      z.treeifyError(parsed.error).properties
    );
  }

  const userId = event.context.user?.id;
  const article = parsed.data;

  const success = await markArticleAsRead(userId, article);

  return sendSuccess(event, { marked_as_read: success });
});

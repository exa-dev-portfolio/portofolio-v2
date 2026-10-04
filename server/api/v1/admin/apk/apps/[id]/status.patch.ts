import { updateAppStatus } from "~~/server/services/apk.service";
import { updateAppStatusSchema } from "~~/server/model/apk.model";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";
import { HttpError } from "~~/server/errors/HttpError";

export default withAuth(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw new HttpError(400, "MISSING_ID", "App ID is required");
  }

  const body = await readBody(event);
  const parsed = updateAppStatusSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid status");
  }

  const updated = await updateAppStatus(id, parsed.data.status);
  return sendSuccess(event, updated, `App status updated to ${parsed.data.status}`);
});

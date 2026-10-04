import { updateAppStoreLinks } from "~~/server/services/apk.service";
import { updateStoreLinksSchema } from "~~/server/model/apk.model";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";
import { HttpError } from "~~/server/errors/HttpError";

export default withAuth(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw new HttpError(400, "MISSING_ID", "App ID is required");
  }

  const body = await readBody(event);
  const parsed = updateStoreLinksSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid store links");
  }

  const updated = await updateAppStoreLinks(id, parsed.data.play_store_url, parsed.data.testflight_url);
  return sendSuccess(event, updated, "App official store links updated successfully");
});

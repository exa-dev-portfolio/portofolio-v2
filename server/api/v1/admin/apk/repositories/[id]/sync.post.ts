import { triggerManualSync } from "~~/server/services/apk.service";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";
import { HttpError } from "~~/server/errors/HttpError";

export default withAuth(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw new HttpError(400, "MISSING_ID", "Repository ID is required");
  }

  const result = await triggerManualSync(id);
  return sendSuccess(event, result, "Manual sync triggered successfully");
});

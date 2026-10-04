import { listBetaTesters } from "~~/server/services/apk.service";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";
import { HttpError } from "~~/server/errors/HttpError";

export default withAuth(async (event) => {
  const appId = getRouterParam(event, "id");
  if (!appId) {
    throw new HttpError(400, "MISSING_APP_ID", "App ID is required");
  }

  const testers = await listBetaTesters(appId);
  return sendSuccess(event, testers, "Beta testers retrieved successfully");
});

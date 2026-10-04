import { adminRevokeBetaTester } from "~~/server/services/apk.service";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";
import { HttpError } from "~~/server/errors/HttpError";

export default withAuth(async (event) => {
  const testerId = getRouterParam(event, "id");
  if (!testerId) {
    throw new HttpError(400, "MISSING_TESTER_ID", "Tester ID is required");
  }

  const body = await readBody(event).catch(() => ({}));
  const updated = await adminRevokeBetaTester(testerId, body?.reason);
  return sendSuccess(event, updated, "Beta tester revoked successfully");
});

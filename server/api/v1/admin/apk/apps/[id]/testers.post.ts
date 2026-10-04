import { adminAddBetaTester } from "~~/server/services/apk.service";
import { adminAddTesterSchema } from "~~/server/model/apk.model";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";
import { HttpError } from "~~/server/errors/HttpError";

export default withAuth(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw new HttpError(400, "MISSING_ID", "App ID is required");
  }

  const body = await readBody(event);
  const parsed = adminAddTesterSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid tester data");
  }

  const tester = await adminAddBetaTester(id, parsed.data.email, parsed.data.platform, parsed.data.days);
  return sendSuccess(event, tester, `Tester ${parsed.data.email} added successfully`);
});

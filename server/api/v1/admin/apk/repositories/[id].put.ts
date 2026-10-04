import { updateRepository } from "~~/server/services/apk.service";
import { updateApkRepositorySchema } from "~~/server/model/apk.model";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";
import { HttpError } from "~~/server/errors/HttpError";

export default withAuth(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw new HttpError(400, "MISSING_ID", "Repository ID is required");
  }

  const body = await readBody(event);
  const parsed = updateApkRepositorySchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid update data", parsed.error.issues);
  }

  const updated = await updateRepository(id, parsed.data);
  return sendSuccess(event, updated, "Repository updated successfully");
});

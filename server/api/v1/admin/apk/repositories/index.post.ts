import { registerRepository } from "~~/server/services/apk.service";
import { createApkRepositorySchema } from "~~/server/model/apk.model";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";
import { HttpError } from "~~/server/errors/HttpError";

export default withAuth(async (event) => {
  const body = await readBody(event);
  const parsed = createApkRepositorySchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid repository data", parsed.error.issues);
  }

  const repo = await registerRepository(parsed.data);
  return sendSuccess(event, repo, "Repository registered successfully", "CREATED", 201);
});

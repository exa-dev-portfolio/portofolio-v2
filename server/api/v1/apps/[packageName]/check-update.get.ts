import { checkAppUpdate } from "~~/server/services/apk.service";
import { sendSuccess } from "~~/server/utils/response";
import { HttpError } from "~~/server/errors/HttpError";

export default defineEventHandler(async (event) => {
  assertApkStoreEnabled();
  const packageName = getRouterParam(event, "packageName");
  if (!packageName) {
    throw new HttpError(400, "MISSING_PACKAGE_NAME", "Package name is required");
  }

  const query = getQuery(event);
  const versionCode = Number(query.version_code || query.versionCode || 0);

  const updateInfo = await checkAppUpdate(packageName, versionCode);
  return sendSuccess(event, updateInfo, "Update check completed");
});

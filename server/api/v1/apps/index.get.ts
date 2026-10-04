import { listPublishedApps } from "~~/server/services/apk.service";
import { sendSuccess } from "~~/server/utils/response";

export default defineEventHandler(async (event) => {
  assertApkStoreEnabled();
  const apps = await listPublishedApps();
  return sendSuccess(event, apps, "Apps retrieved successfully");
});

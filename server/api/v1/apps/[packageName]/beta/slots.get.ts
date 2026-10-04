import { getBetaSlotInfo } from "~~/server/services/apk.service";
import { sendSuccess } from "~~/server/utils/response";
import { HttpError } from "~~/server/errors/HttpError";

export default defineEventHandler(async (event) => {
  assertApkStoreEnabled();
  const packageName = getRouterParam(event, "packageName");
  if (!packageName) {
    throw new HttpError(400, "MISSING_PACKAGE_NAME", "Package name is required");
  }

  const query = getQuery(event);
  const platform = (query.platform as "ios" | "android") || "ios";

  const slotInfo = await getBetaSlotInfo(packageName, platform);
  return sendSuccess(event, slotInfo, "Slot info retrieved successfully");
});

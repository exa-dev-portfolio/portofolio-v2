import { requestBetaAccessOtp } from "~~/server/services/apk.service";
import { requestBetaOtpSchema } from "~~/server/model/apk.model";
import { sendSuccess } from "~~/server/utils/response";
import { HttpError } from "~~/server/errors/HttpError";

export default defineEventHandler(async (event) => {
  assertApkStoreEnabled();
  const packageName = getRouterParam(event, "packageName");
  if (!packageName) {
    throw new HttpError(400, "MISSING_PACKAGE_NAME", "Package name is required");
  }

  const body = await readBody(event);
  const parsed = requestBetaOtpSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid input");
  }

  const clientIp = getRequestIP(event, { xForwardedFor: true }) || "127.0.0.1";
  const result = await requestBetaAccessOtp(
    packageName,
    parsed.data.platform,
    parsed.data.email,
    clientIp
  );

  return sendSuccess(event, result, result.message);
});

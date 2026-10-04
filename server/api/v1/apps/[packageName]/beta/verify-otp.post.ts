import { verifyBetaAccessOtp } from "~~/server/services/apk.service";
import { verifyBetaOtpSchema } from "~~/server/model/apk.model";
import { sendSuccess } from "~~/server/utils/response";
import { HttpError } from "~~/server/errors/HttpError";

export default defineEventHandler(async (event) => {
  assertApkStoreEnabled();
  const packageName = getRouterParam(event, "packageName");
  if (!packageName) {
    throw new HttpError(400, "MISSING_PACKAGE_NAME", "Package name is required");
  }

  const body = await readBody(event);
  const parsed = verifyBetaOtpSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid input");
  }

  const result = await verifyBetaAccessOtp(
    packageName,
    parsed.data.platform,
    parsed.data.email,
    parsed.data.otp
  );

  return sendSuccess(event, result, result.message);
});

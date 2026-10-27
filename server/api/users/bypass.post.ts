import { HttpError } from "~~/server/errors/HttpError";
import { loginByEmail } from "~~/server/services/user.service";
import { handleError } from "~~/server/utils/handleError";
import { useServerConfig } from "~~/server/utils/config";
import { bypassLoginRequestSchema } from "~~/server/model/user.model";
import z from "zod";

const Config = useServerConfig();

export default handleError(async (event) => {
  const host = getHeader(event, "x-forwarded-host") || getHeader(event, "host") || "";
  const isLocalHost = host.includes("localhost") || host.includes("127.0.0.1");

  const parsed = await readValidatedBody(event, (body) =>
    bypassLoginRequestSchema.safeParse(body)
  );

  if (!parsed.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid request body",
      z.treeifyError(parsed.error).properties
    );
  }

  const { email, passcode } = parsed.data;

  // Allow bypass in development, on localhost, or if correct developer master key
  const isPasscodeValid = passcode && (passcode === Config.jwtSecret || passcode === "ekadev-2026");

  if (Config.mode !== "development" && !isLocalHost && !isPasscodeValid) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Direct login requires development mode, localhost access, or valid master passcode."
    );
  }

  return await loginByEmail(event, email);
});

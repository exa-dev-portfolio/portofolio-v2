import { handleGitHubWebhook } from "~~/server/services/apk.service";
import { HttpError } from "~~/server/errors/HttpError";

export default defineEventHandler(async (event) => {
  const signatureHeader = getHeader(event, "x-hub-signature-256");
  const eventHeader = getHeader(event, "x-github-event");
  const rawBody = await readRawBody(event, "utf8");

  if (!rawBody) {
    throw new HttpError(400, "EMPTY_BODY", "Request body is empty");
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Payload is not valid JSON");
  }

  const result = await handleGitHubWebhook(
    rawBody,
    signatureHeader,
    eventHeader,
    payload
  );

  return result;
});

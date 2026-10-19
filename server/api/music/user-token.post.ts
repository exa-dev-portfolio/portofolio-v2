import { handleError } from "~~/server/utils/handleError";
import { saveAppleMusicUserToken } from "~~/server/services/appleMusic.service";
import { sendSuccess } from "~~/server/utils/response";
import { HttpError } from "~~/server/errors/HttpError";
import { readBody } from "h3";

export default handleError(async (event) => {
  const body = await readBody(event);
  const userToken = body?.userToken;

  if (!userToken || typeof userToken !== "string" || !userToken.trim()) {
    throw new HttpError(
      400,
      "INVALID_USER_TOKEN",
      "User token Apple Music tidak valid"
    );
  }

  await saveAppleMusicUserToken(userToken.trim());

  return sendSuccess(
    event,
    { success: true },
    "Apple Music user token saved successfully",
    "apple_music_token_saved"
  );
});

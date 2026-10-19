import { handleError } from "~~/server/utils/handleError";
import { generateAppleMusicDeveloperToken, hasAppleMusicDeveloperKeys } from "~~/server/services/appleMusic.service";
import { sendSuccess } from "~~/server/utils/response";
import { HttpError } from "~~/server/errors/HttpError";

export default handleError(async (event) => {
  if (!hasAppleMusicDeveloperKeys()) {
    throw new HttpError(
      400,
      "DEVELOPER_KEYS_NOT_CONFIGURED",
      "Kredensial developer (Key ID, Team ID, .p8) belum diisi di file .env"
    );
  }

  const developerToken = generateAppleMusicDeveloperToken();
  if (!developerToken) {
    throw new HttpError(
      500,
      "TOKEN_GENERATION_FAILED",
      "Gagal membuat Apple Music Developer Token"
    );
  }

  return sendSuccess(
    event,
    { developerToken },
    "Developer token generated successfully",
    "developer_token_generated"
  );
});

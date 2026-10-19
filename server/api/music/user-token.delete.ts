import { handleError } from "~~/server/utils/handleError";
import { clearAppleMusicUserToken } from "~~/server/services/appleMusic.service";
import { sendSuccess } from "~~/server/utils/response";

export default handleError(async (event) => {
  await clearAppleMusicUserToken();

  return sendSuccess(
    event,
    { success: true },
    "Apple Music disconnected successfully",
    "apple_music_token_cleared"
  );
});

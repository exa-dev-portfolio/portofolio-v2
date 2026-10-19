import { handleError } from "~~/server/utils/handleError";
import { getAppleMusicStatus } from "~~/server/services/appleMusic.service";
import { sendSuccess } from "~~/server/utils/response";

export default handleError(async (event) => {
  const status = await getAppleMusicStatus();
  return sendSuccess(
    event,
    status,
    "Apple Music status retrieved successfully",
    "apple_music_status_retrieved"
  );
});

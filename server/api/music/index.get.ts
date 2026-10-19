import { handleError } from "~~/server/utils/handleError";
import { getAppleMusicStatus } from "~~/server/services/appleMusic.service";
import { sendSuccess } from "~~/server/utils/response";

import { getQuery } from "h3";

export default handleError(async (event) => {
  const query = getQuery(event);
  const includeDemo = query.demo === "true";
  const status = await getAppleMusicStatus(includeDemo);
  return sendSuccess(
    event,
    status,
    "Apple Music status retrieved successfully",
    "apple_music_status_retrieved"
  );
});

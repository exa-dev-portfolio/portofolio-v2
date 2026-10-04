import { listAllApps } from "~~/server/services/apk.service";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";

export default withAuth(async (event) => {
  const apps = await listAllApps();
  return sendSuccess(event, apps, "Apps retrieved successfully");
});

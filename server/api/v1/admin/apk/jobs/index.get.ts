import { listRecentSyncJobs } from "~~/server/services/apk.service";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";

export default withAuth(async (event) => {
  const query = getQuery(event);
  const limit = query.limit ? Number(query.limit) : 20;

  const jobs = await listRecentSyncJobs(limit);
  return sendSuccess(event, jobs, "Recent sync jobs retrieved successfully");
});

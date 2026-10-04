import { listRepositories } from "~~/server/services/apk.service";
import { sendSuccess } from "~~/server/utils/response";
import { withAuth } from "~~/server/utils/withAuth";

export default withAuth(async (event) => {
  const repos = await listRepositories();
  return sendSuccess(event, repos, "Repositories retrieved successfully");
});

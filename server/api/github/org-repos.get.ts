import { handleError } from "~~/server/utils/handleError";
import { HttpError } from "~~/server/errors/HttpError";
import { fetchGitHubOrgRepos } from "~~/server/services/github.service";
import { sendSuccess } from "~~/server/utils/response";
import z from "zod";

const querySchema = z.object({
  org: z.string().min(1, "Organization name or URL is required"),
});

export default handleError(async (event) => {
  const parsed = await getValidatedQuery(event, (query) =>
    querySchema.safeParse(query),
  );

  if (!parsed.success) {
    throw new HttpError(400, "INVALID_QUERY", "Parameter 'org' is required");
  }

  try {
    const data = await fetchGitHubOrgRepos(parsed.data.org);
    return sendSuccess(
      event,
      data,
      "GitHub repositories retrieved successfully",
      "github_repos_retrieved",
    );
  } catch (error: any) {
    throw new HttpError(
      404,
      "GITHUB_FETCH_FAILED",
      error.message || "Failed to fetch GitHub repositories",
    );
  }
});

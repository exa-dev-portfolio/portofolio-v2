import { HttpError } from "~~/server/errors/HttpError";

export function assertApkStoreEnabled() {
  const config = useRuntimeConfig();
  if (!config.public?.enableApkStore) {
    throw new HttpError(404, "NOT_FOUND", "Feature is not enabled");
  }
}

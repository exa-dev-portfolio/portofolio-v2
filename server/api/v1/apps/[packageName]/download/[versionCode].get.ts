import { getDownloadRelease } from "~~/server/services/apk.service";
import { getMinioClientInstance } from "~~/server/lib/minio";
import { HttpError } from "~~/server/errors/HttpError";

export default defineEventHandler(async (event) => {
  assertApkStoreEnabled();
  const packageName = getRouterParam(event, "packageName");
  const versionCodeParam = getRouterParam(event, "versionCode");

  if (!packageName) {
    throw new HttpError(400, "MISSING_PACKAGE_NAME", "Package name is required");
  }

  const versionCode = versionCodeParam ? Number(versionCodeParam) : undefined;
  const { app, release } = await getDownloadRelease(packageName, versionCode);

  const safeFileName = `${app.app_name.replace(/[^a-zA-Z0-9_.-]/g, "_")}-v${release.version_name}.apk`;

  setHeader(event, "Content-Type", "application/vnd.android.package-archive");
  setHeader(event, "Content-Disposition", `attachment; filename="${safeFileName}"`);
  if (release.file_size_bytes) {
    setHeader(event, "Content-Length", String(release.file_size_bytes));
  }

  // Stream from MinIO if storage_path is set
  if (release.storage_path) {
    try {
      const minio = getMinioClientInstance();
      let bucket = "project";
      let objectName = release.storage_path;

      if (release.storage_path.includes("/")) {
        const parts = release.storage_path.split("/");
        bucket = parts[0];
        objectName = parts.slice(1).join("/");
      }

      const stream = await minio.getObject(bucket, objectName);
      return sendStream(event, stream);
    } catch (err) {
      // If MinIO stream fails, fallback to download_url if available
      if (release.download_url) {
        return sendRedirect(event, release.download_url, 302);
      }
      throw err;
    }
  }

  // Direct redirect if download_url is set
  if (release.download_url) {
    return sendRedirect(event, release.download_url, 302);
  }

  throw new HttpError(404, "RELEASE_FILE_NOT_FOUND", "APK file binary is not available");
});

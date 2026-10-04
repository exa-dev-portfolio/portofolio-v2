import crypto from "node:crypto";
import { withTransaction } from "~~/server/db/postgres";
import { HttpError } from "~~/server/errors/HttpError";
import type {
  CreateApkRepositoryInput,
  UpdateApkRepositoryInput,
} from "~~/server/model/apk.model";
import * as apkRepo from "~~/server/repositories/apk.repository";
import { logger } from "~~/server/utils/logger";

const getWorkerConfig = () => {
  const config = useRuntimeConfig();
  return {
    url: config.jobWorkerUrl || "http://localhost:9090",
    secret: config.jobWorkerSecret || "",
  };
};

/**
 * Verify GitHub webhook HMAC-SHA256 signature
 */
export function verifyGitHubSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") return false;

  const expectedSignature = parts[1];
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const actualSignature = hmac.digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(actualSignature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Register a new repository for APK distribution
 */
export async function registerRepository(input: CreateApkRepositoryInput) {
  return withTransaction(async (client) => {
    const existing = await apkRepo.getRepositoryBySlug(client, input.repo_slug);
    if (existing) {
      throw new HttpError(409, `Repository "${input.repo_slug}" is already registered`);
    }

    const webhook_secret =
      input.webhook_secret || crypto.randomBytes(24).toString("hex");

    return await apkRepo.createRepository(client, {
      ...input,
      webhook_secret,
    });
  });
}

/**
 * Update repository configuration
 */
export async function updateRepository(
  id: string,
  input: UpdateApkRepositoryInput
) {
  return withTransaction(async (client) => {
    const existing = await apkRepo.getRepositoryById(client, id);
    if (!existing) {
      throw new HttpError(404, "Repository not found");
    }

    return await apkRepo.updateRepository(client, id, input);
  });
}

/**
 * Delete repository and cascade delete associated apps & releases
 */
export async function deleteRepository(id: string) {
  return withTransaction(async (client) => {
    const existing = await apkRepo.getRepositoryById(client, id);
    if (!existing) {
      throw new HttpError(404, "Repository not found");
    }
    return await apkRepo.deleteRepository(client, id);
  });
}

/**
 * List all registered repositories
 */
export async function listRepositories() {
  return withTransaction(async (client) => {
    return await apkRepo.listRepositories(client);
  });
}

/**
 * Get repository by ID
 */
export async function getRepositoryById(id: string) {
  return withTransaction(async (client) => {
    const repo = await apkRepo.getRepositoryById(client, id);
    if (!repo) throw new HttpError(404, "Repository not found");
    return repo;
  });
}

/**
 * List published apps with latest release
 */
export async function listPublishedApps() {
  return withTransaction(async (client) => {
    return await apkRepo.listPublishedApps(client);
  });
}

/**
 * Get app detail with release history
 */
export async function getAppDetail(packageName: string) {
  return withTransaction(async (client) => {
    const app = await apkRepo.getAppByPackageName(client, packageName);
    if (!app) {
      throw new HttpError(404, `App with package name "${packageName}" not found`);
    }

    const releases = await apkRepo.listReleasesByAppId(client, app.id);
    return {
      ...app,
      releases,
    };
  });
}

/**
 * Check if a newer version is available for an installed app
 */
export async function checkAppUpdate(
  packageName: string,
  currentVersionCode: number
) {
  return withTransaction(async (client) => {
    const app = await apkRepo.getAppByPackageName(client, packageName);
    if (!app) {
      throw new HttpError(404, `App "${packageName}" not found`);
    }

    const latest = await apkRepo.getLatestRelease(client, app.id);
    if (!latest) {
      return {
        has_update: false,
        message: "No releases found for this app",
      };
    }

    const hasUpdate = latest.version_code > currentVersionCode;
    return {
      has_update: hasUpdate,
      package_name: app.package_name,
      app_name: app.app_name,
      current_version_code: currentVersionCode,
      latest_version_code: latest.version_code,
      latest_version_name: latest.version_name,
      download_url: `/api/v1/apps/${app.package_name}/download/${latest.version_code}`,
      changelog: latest.changelog,
      file_size_bytes: latest.file_size_bytes,
      sha256_hash: latest.sha256_hash,
      published_at: latest.published_at,
    };
  });
}

/**
 * Trigger background worker to process APK sync
 */
async function notifyWorker(payload: Record<string, unknown>): Promise<boolean> {
  const { url, secret } = getWorkerConfig();
  try {
    const res = await fetch(`${url}/apk/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": secret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, "[apk.service] worker /apk/sync returned non-200");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "[apk.service] failed to trigger worker /apk/sync");
    return false;
  }
}

/**
 * Handle incoming GitHub Webhook
 */
export async function handleGitHubWebhook(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  eventHeader: string | undefined,
  payload: any
) {
  if (eventHeader !== "release") {
    return { ok: true, ignored: true, reason: `Ignored event: ${eventHeader}` };
  }

  const action = payload.action;
  if (action !== "published") {
    return { ok: true, ignored: true, reason: `Ignored release action: ${action}` };
  }

  const repoSlug = payload.repository?.full_name;
  if (!repoSlug) {
    throw new HttpError(400, "Missing repository full_name in webhook payload");
  }

  const { repo, job } = await withTransaction(async (client) => {
    const foundRepo = await apkRepo.getRepositoryBySlug(client, repoSlug);
    if (!foundRepo) {
      logger.warn(`[apk.service] Webhook received for unregistered repo: ${repoSlug}`);
      throw new HttpError(404, `Repository "${repoSlug}" is not registered in APK Store`);
    }

    // Validate HMAC signature
    const isValid = verifyGitHubSignature(rawBody, signatureHeader, foundRepo.webhook_secret);
    if (!isValid) {
      logger.warn(`[apk.service] Invalid webhook signature for repo ${repoSlug}`);
      throw new HttpError(401, "Invalid webhook signature");
    }

    // Create sync job
    const createdJob = await apkRepo.createSyncJob(client, foundRepo.id, "webhook", {
      tag_name: payload.release?.tag_name,
      release_id: payload.release?.id,
      assets_count: payload.release?.assets?.length || 0,
    });

    return { repo: foundRepo, job: createdJob };
  });

  // Notify worker asynchronously
  notifyWorker({
    jobId: job.id,
    repoId: repo.id,
    repoSlug: repo.repo_slug,
    isPrivate: repo.is_private,
    accessToken: repo.access_token,
    assetFilterRegex: repo.asset_filter_regex,
    release: payload.release,
  }).catch((e) => {
    logger.error({ err: e }, "[apk.service] notifyWorker error");
  });

  return {
    ok: true,
    message: "Webhook accepted and queued for processing",
    job_id: job.id,
  };
}

/**
 * Trigger manual sync for a repository (calls GitHub latest release API)
 */
export async function triggerManualSync(repoId: string) {
  const { repo, job } = await withTransaction(async (client) => {
    const foundRepo = await apkRepo.getRepositoryById(client, repoId);
    if (!foundRepo) throw new HttpError(404, "Repository not found");

    const createdJob = await apkRepo.createSyncJob(client, foundRepo.id, "manual_sync", {
      initiated_at: new Date().toISOString(),
    });

    return { repo: foundRepo, job: createdJob };
  });

  // Notify worker
  notifyWorker({
    jobId: job.id,
    repoId: repo.id,
    repoSlug: repo.repo_slug,
    isPrivate: repo.is_private,
    accessToken: repo.access_token,
    assetFilterRegex: repo.asset_filter_regex,
    isManual: true,
  }).catch((e) => {
    logger.error({ err: e }, "[apk.service] notifyWorker manual sync error");
  });

  return {
    ok: true,
    message: "Sync job initiated successfully",
    job_id: job.id,
  };
}

/**
 * List recent sync jobs for admin audit
 */
export async function listRecentSyncJobs(limit = 20) {
  return withTransaction(async (client) => {
    return await apkRepo.listRecentSyncJobs(client, limit);
  });
}

/**
 * Resolve APK release file for streaming download
 */
export async function getDownloadRelease(packageName: string, versionCode?: number) {
  return withTransaction(async (client) => {
    const app = await apkRepo.getAppByPackageName(client, packageName);
    if (!app) {
      throw new HttpError(404, `App "${packageName}" not found`);
    }

    let release;
    if (versionCode) {
      release = await apkRepo.getReleaseByVersion(client, app.id, versionCode);
    } else {
      release = await apkRepo.getLatestRelease(client, app.id);
    }

    if (!release) {
      throw new HttpError(404, `Release not found for "${packageName}"`);
    }

    // Increment downloads inside transaction
    await apkRepo.incrementAppDownload(client, app.id);
    await apkRepo.incrementReleaseDownload(client, release.id);

    return { app, release };
  });
}

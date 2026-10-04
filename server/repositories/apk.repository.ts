import type { PoolClient } from "pg";
import type {
  ApkAppModel,
  ApkReleaseModel,
  ApkRepositoryModel,
  ApkSyncJobModel,
  CreateApkRepositoryInput,
  UpdateApkRepositoryInput,
} from "~~/server/model/apk.model";

// ==========================================
// REPOSITORIES
// ==========================================

export const createRepository = async (
  client: PoolClient,
  data: CreateApkRepositoryInput & { webhook_secret: string }
): Promise<ApkRepositoryModel> => {
  const sql = `
    INSERT INTO apk_repositories (repo_slug, is_private, access_token, webhook_secret, asset_filter_regex)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [
    data.repo_slug,
    data.is_private ?? false,
    data.access_token || null,
    data.webhook_secret,
    data.asset_filter_regex || ".*\\.apk$",
  ];
  const res = await client.query<ApkRepositoryModel>(sql, values);
  return res.rows[0];
};

export const updateRepository = async (
  client: PoolClient,
  id: string,
  data: UpdateApkRepositoryInput
): Promise<ApkRepositoryModel | null> => {
  const updates: string[] = [];
  const values: unknown[] = [id];
  let idx = 2;

  if (data.is_private !== undefined) {
    updates.push(`is_private = $${idx++}`);
    values.push(data.is_private);
  }
  if (data.access_token !== undefined) {
    updates.push(`access_token = $${idx++}`);
    values.push(data.access_token);
  }
  if (data.webhook_secret !== undefined) {
    updates.push(`webhook_secret = $${idx++}`);
    values.push(data.webhook_secret);
  }
  if (data.asset_filter_regex !== undefined) {
    updates.push(`asset_filter_regex = $${idx++}`);
    values.push(data.asset_filter_regex);
  }

  if (updates.length === 0) {
    return getRepositoryById(client, id);
  }

  updates.push(`updated_at = current_timestamp`);

  const sql = `
    UPDATE apk_repositories
    SET ${updates.join(", ")}
    WHERE id = $1
    RETURNING *
  `;
  const res = await client.query<ApkRepositoryModel>(sql, values);
  return res.rows[0] || null;
};

export const deleteRepository = async (
  client: PoolClient,
  id: string
): Promise<boolean> => {
  const res = await client.query(
    "DELETE FROM apk_repositories WHERE id = $1",
    [id]
  );
  return (res.rowCount ?? 0) > 0;
};

export const getRepositoryById = async (
  client: PoolClient,
  id: string
): Promise<ApkRepositoryModel | null> => {
  const res = await client.query<ApkRepositoryModel>(
    "SELECT * FROM apk_repositories WHERE id = $1",
    [id]
  );
  return res.rows[0] || null;
};

export const getRepositoryBySlug = async (
  client: PoolClient,
  slug: string
): Promise<ApkRepositoryModel | null> => {
  const res = await client.query<ApkRepositoryModel>(
    "SELECT * FROM apk_repositories WHERE LOWER(repo_slug) = LOWER($1)",
    [slug]
  );
  return res.rows[0] || null;
};

export const listRepositories = async (
  client: PoolClient
): Promise<(ApkRepositoryModel & { app_count: number; release_count: number })[]> => {
  const sql = `
    SELECT r.*,
      COUNT(DISTINCT a.id)::int AS app_count,
      COUNT(DISTINCT rel.id)::int AS release_count
    FROM apk_repositories r
    LEFT JOIN apk_apps a ON a.repo_id = r.id
    LEFT JOIN apk_releases rel ON rel.app_id = a.id
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `;
  const res = await client.query<
    ApkRepositoryModel & { app_count: number; release_count: number }
  >(sql);
  return res.rows;
};

// ==========================================
// APPS
// ==========================================

export const upsertApp = async (
  client: PoolClient,
  data: {
    repo_id: string;
    package_name: string;
    app_name: string;
    description?: string | null;
    icon_url?: string | null;
    latest_version_code: number;
    latest_version_name?: string | null;
  }
): Promise<ApkAppModel> => {
  const sql = `
    INSERT INTO apk_apps (
      repo_id, package_name, app_name, description, icon_url,
      latest_version_code, latest_version_name, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, current_timestamp)
    ON CONFLICT (package_name) DO UPDATE SET
      repo_id = EXCLUDED.repo_id,
      app_name = EXCLUDED.app_name,
      description = COALESCE(EXCLUDED.description, apk_apps.description),
      icon_url = COALESCE(EXCLUDED.icon_url, apk_apps.icon_url),
      latest_version_code = GREATEST(apk_apps.latest_version_code, EXCLUDED.latest_version_code),
      latest_version_name = CASE
        WHEN EXCLUDED.latest_version_code >= apk_apps.latest_version_code
        THEN EXCLUDED.latest_version_name
        ELSE apk_apps.latest_version_name
      END,
      updated_at = current_timestamp
    RETURNING *
  `;
  const values = [
    data.repo_id,
    data.package_name,
    data.app_name,
    data.description || null,
    data.icon_url || null,
    data.latest_version_code,
    data.latest_version_name || null,
  ];
  const res = await client.query<ApkAppModel>(sql, values);
  return res.rows[0];
};

export const getAppByPackageName = async (
  client: PoolClient,
  packageName: string
): Promise<ApkAppModel | null> => {
  const sql = `
    SELECT a.*, r.repo_slug
    FROM apk_apps a
    JOIN apk_repositories r ON r.id = a.repo_id
    WHERE a.package_name = $1
  `;
  const res = await client.query<ApkAppModel>(sql, [packageName]);
  return res.rows[0] || null;
};

export const getAppById = async (
  client: PoolClient,
  id: string
): Promise<ApkAppModel | null> => {
  const sql = `
    SELECT a.*, r.repo_slug
    FROM apk_apps a
    JOIN apk_repositories r ON r.id = a.repo_id
    WHERE a.id = $1
  `;
  const res = await client.query<ApkAppModel>(sql, [id]);
  return res.rows[0] || null;
};

export const listPublishedApps = async (
  client: PoolClient
): Promise<(ApkAppModel & { latest_release?: ApkReleaseModel | null })[]> => {
  const sql = `
    SELECT a.*, r.repo_slug,
      json_build_object(
        'id', rel.id,
        'tag_name', rel.tag_name,
        'version_code', rel.version_code,
        'version_name', rel.version_name,
        'min_sdk', rel.min_sdk,
        'target_sdk', rel.target_sdk,
        'changelog', rel.changelog,
        'file_size_bytes', rel.file_size_bytes,
        'sha256_hash', rel.sha256_hash,
        'published_at', rel.published_at
      ) AS latest_release
    FROM apk_apps a
    JOIN apk_repositories r ON r.id = a.repo_id
    LEFT JOIN LATERAL (
      SELECT * FROM apk_releases
      WHERE app_id = a.id
      ORDER BY version_code DESC
      LIMIT 1
    ) rel ON true
    WHERE a.is_published = true
    ORDER BY a.updated_at DESC
  `;
  const res = await client.query(sql);
  return res.rows;
};

export const incrementAppDownload = async (
  client: PoolClient,
  appId: string
): Promise<void> => {
  await client.query(
    "UPDATE apk_apps SET download_count = download_count + 1 WHERE id = $1",
    [appId]
  );
};

// ==========================================
// RELEASES
// ==========================================

export const upsertRelease = async (
  client: PoolClient,
  data: {
    app_id: string;
    github_release_id?: number | null;
    tag_name: string;
    version_code: number;
    version_name: string;
    min_sdk?: number | null;
    target_sdk?: number | null;
    changelog?: string | null;
    file_size_bytes: number;
    sha256_hash?: string | null;
    storage_path?: string | null;
    download_url?: string | null;
    published_at?: string | null;
  }
): Promise<ApkReleaseModel> => {
  const sql = `
    INSERT INTO apk_releases (
      app_id, github_release_id, tag_name, version_code, version_name,
      min_sdk, target_sdk, changelog, file_size_bytes, sha256_hash,
      storage_path, download_url, published_at, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, current_timestamp)
    ON CONFLICT (app_id, version_code) DO UPDATE SET
      github_release_id = COALESCE(EXCLUDED.github_release_id, apk_releases.github_release_id),
      tag_name = EXCLUDED.tag_name,
      version_name = EXCLUDED.version_name,
      min_sdk = COALESCE(EXCLUDED.min_sdk, apk_releases.min_sdk),
      target_sdk = COALESCE(EXCLUDED.target_sdk, apk_releases.target_sdk),
      changelog = COALESCE(EXCLUDED.changelog, apk_releases.changelog),
      file_size_bytes = EXCLUDED.file_size_bytes,
      sha256_hash = COALESCE(EXCLUDED.sha256_hash, apk_releases.sha256_hash),
      storage_path = COALESCE(EXCLUDED.storage_path, apk_releases.storage_path),
      download_url = COALESCE(EXCLUDED.download_url, apk_releases.download_url),
      published_at = COALESCE(EXCLUDED.published_at, apk_releases.published_at)
    RETURNING *
  `;
  const values = [
    data.app_id,
    data.github_release_id || null,
    data.tag_name,
    data.version_code,
    data.version_name,
    data.min_sdk || null,
    data.target_sdk || null,
    data.changelog || null,
    data.file_size_bytes,
    data.sha256_hash || null,
    data.storage_path || null,
    data.download_url || null,
    data.published_at || null,
  ];
  const res = await client.query<ApkReleaseModel>(sql, values);
  return res.rows[0];
};

export const getReleaseByVersion = async (
  client: PoolClient,
  appId: string,
  versionCode: number
): Promise<ApkReleaseModel | null> => {
  const sql = `
    SELECT * FROM apk_releases
    WHERE app_id = $1 AND version_code = $2
  `;
  const res = await client.query<ApkReleaseModel>(sql, [appId, versionCode]);
  return res.rows[0] || null;
};

export const getLatestRelease = async (
  client: PoolClient,
  appId: string
): Promise<ApkReleaseModel | null> => {
  const sql = `
    SELECT * FROM apk_releases
    WHERE app_id = $1
    ORDER BY version_code DESC
    LIMIT 1
  `;
  const res = await client.query<ApkReleaseModel>(sql, [appId]);
  return res.rows[0] || null;
};

export const listReleasesByAppId = async (
  client: PoolClient,
  appId: string
): Promise<ApkReleaseModel[]> => {
  const sql = `
    SELECT * FROM apk_releases
    WHERE app_id = $1
    ORDER BY version_code DESC
  `;
  const res = await client.query<ApkReleaseModel>(sql, [appId]);
  return res.rows;
};

export const incrementReleaseDownload = async (
  client: PoolClient,
  releaseId: string
): Promise<void> => {
  await client.query(
    "UPDATE apk_releases SET download_count = download_count + 1 WHERE id = $1",
    [releaseId]
  );
};

// ==========================================
// SYNC JOBS
// ==========================================

export const createSyncJob = async (
  client: PoolClient,
  repoId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<ApkSyncJobModel> => {
  const sql = `
    INSERT INTO apk_sync_jobs (repo_id, event_type, status, payload)
    VALUES ($1, $2, 'pending', $3)
    RETURNING *
  `;
  const res = await client.query<ApkSyncJobModel>(sql, [
    repoId,
    eventType,
    JSON.stringify(payload),
  ]);
  return res.rows[0];
};

export const updateSyncJobStatus = async (
  client: PoolClient,
  id: string,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string | null
): Promise<void> => {
  const sql = `
    UPDATE apk_sync_jobs
    SET status = $2, error_message = $3, updated_at = current_timestamp
    WHERE id = $1
  `;
  await client.query(sql, [id, status, errorMessage || null]);
};

export const listRecentSyncJobs = async (
  client: PoolClient,
  limit: number = 20
): Promise<(ApkSyncJobModel & { repo_slug: string })[]> => {
  const sql = `
    SELECT j.*, r.repo_slug
    FROM apk_sync_jobs j
    JOIN apk_repositories r ON r.id = j.repo_id
    ORDER BY j.created_at DESC
    LIMIT $1
  `;
  const res = await client.query<ApkSyncJobModel & { repo_slug: string }>(sql, [limit]);
  return res.rows;
};

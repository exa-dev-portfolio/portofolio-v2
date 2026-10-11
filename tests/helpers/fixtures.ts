import { query } from "~~/server/db/postgres";

export interface CreateTestAppOptions {
  packageName?: string;
  appName?: string;
  appleBetaGroupId?: string | null;
  googleTesterGroupEmail?: string | null;
  playStoreUrl?: string | null;
  testflightUrl?: string | null;
}

export async function createTestApp(options: CreateTestAppOptions = {}) {
  const repoSlug = `test-org/repo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const repoRes = await query<{ id: string }>(
    `INSERT INTO apk_repositories (repo_slug, webhook_secret)
     VALUES ($1, 'secret123')
     RETURNING id`,
    [repoSlug]
  );
  const repoId = repoRes.rows[0].id;

  const packageName = options.packageName || `com.example.testapp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
  const appName = options.appName || "Test Portfolio App";

  const appRes = await query(
    `INSERT INTO apk_apps (
       repo_id, package_name, app_name, is_published,
       apple_beta_group_id, google_tester_group_email,
       play_store_url, app_store_url, testflight_url
     )
     VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      repoId,
      packageName,
      appName,
      options.appleBetaGroupId ?? null,
      options.googleTesterGroupEmail ?? null,
      options.playStoreUrl ?? null,
      options.appStoreUrl ?? null,
      options.testflightUrl ?? null,
    ]
  );

  return appRes.rows[0];
}

export function createMockEvent(user?: { id: string; email?: string; name?: string }) {
  return {
    node: {
      res: {
        statusCode: 200,
      },
    },
    context: {
      user: user || {
        id: "1e7b8f9c-3c4d-4e5f-8a9b-0c1d2e3f4a5b",
        email: "bloodsuker18@gmail.com",
        name: "Moh. Eka Syafrino Nazhifan",
      },
    },
  } as any;
}

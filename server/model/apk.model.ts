import { z } from "zod";

export const createApkRepositorySchema = z.object({
  repo_slug: z
    .string()
    .min(3, "Repo slug is required")
    .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Format must be owner/repo (e.g. acme/mobile-app)"),
  is_private: z.boolean().default(false),
  access_token: z.string().optional().nullable(),
  webhook_secret: z.string().optional(),
  asset_filter_regex: z.string().default(".*\\.apk$"),
});

export type CreateApkRepositoryInput = z.infer<typeof createApkRepositorySchema>;

export const updateApkRepositorySchema = z.object({
  is_private: z.boolean().optional(),
  access_token: z.string().optional().nullable(),
  webhook_secret: z.string().optional(),
  asset_filter_regex: z.string().optional(),
});

export type UpdateApkRepositoryInput = z.infer<typeof updateApkRepositorySchema>;

export interface ApkRepositoryModel {
  id: string;
  repo_slug: string;
  is_private: boolean;
  access_token: string | null;
  webhook_secret: string;
  asset_filter_regex: string;
  created_at: string;
  updated_at: string;
}

export interface ApkAppModel {
  id: string;
  repo_id: string;
  package_name: string;
  app_name: string;
  description: string | null;
  icon_url: string | null;
  latest_version_code: number;
  latest_version_name: string | null;
  is_published: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  repo_slug?: string;
}

export interface ApkReleaseModel {
  id: string;
  app_id: string;
  github_release_id: number | null;
  tag_name: string;
  version_code: number;
  version_name: string;
  min_sdk: number | null;
  target_sdk: number | null;
  changelog: string | null;
  file_size_bytes: number;
  sha256_hash: string | null;
  storage_path: string | null;
  download_url: string | null;
  download_count: number;
  published_at: string | null;
  created_at: string;
}

export interface ApkAppDetail extends ApkAppModel {
  releases: ApkReleaseModel[];
}

export interface ApkSyncJobModel {
  id: string;
  repo_id: string;
  event_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

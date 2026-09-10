import { get, set } from "~~/server/db/redis";
import { logger } from "~~/server/utils/logger";

export interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  homepage: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  updated_at: string;
  is_fork: boolean;
  archived: boolean;
  app_type: "mobile" | "web" | "backend" | "pos" | "other";
}

export interface GitHubOrgResult {
  org: string;
  org_url: string;
  avatar_url: string;
  total_repos: number;
  repos: GitHubRepoItem[];
}

// In-memory fallback cache in case Redis is not available
const memoryCache = new Map<string, { data: GitHubOrgResult; expiresAt: number }>();

export function extractGitHubSlug(input: string): string {
  if (!input) return "";
  let clean = input.trim();
  // Remove trailing slashes
  clean = clean.replace(/\/+$/, "");

  // Match https://github.com/orgs/{org}/... or https://github.com/{org}
  const orgsMatch = clean.match(/github\.com\/orgs\/([^/?#]+)/i);
  if (orgsMatch && orgsMatch[1]) {
    return orgsMatch[1];
  }

  const userMatch = clean.match(/github\.com\/([^/?#]+)/i);
  if (userMatch && userMatch[1]) {
    return userMatch[1];
  }

  // If input was just a slug like "my-org"
  return clean.replace(/^@/, "");
}

export function detectAppType(name: string, description: string, topics: string[] = [], language?: string): "mobile" | "web" | "backend" | "pos" | "other" {
  const text = `${name} ${description} ${topics.join(" ")} ${language || ""}`.toLowerCase();

  if (text.includes("pos") || text.includes("kiosk") || text.includes("kios") || text.includes("kasir") || text.includes("cashier")) {
    return "pos";
  }

  if (
    text.includes("mobile") ||
    text.includes("flutter") ||
    text.includes("android") ||
    text.includes("ios") ||
    text.includes("react-native") ||
    text.includes("kotlin") ||
    text.includes("swift")
  ) {
    return "mobile";
  }

  if (
    text.includes("backend") ||
    text.includes("api") ||
    text.includes("server") ||
    text.includes("microservice") ||
    text.includes("service") ||
    text.includes("golang") ||
    text.includes("fiber") ||
    text.includes("gin") ||
    text.includes("fastify") ||
    text.includes("express") ||
    text.includes("nest")
  ) {
    return "backend";
  }

  if (
    text.includes("web") ||
    text.includes("frontend") ||
    text.includes("client") ||
    text.includes("nuxt") ||
    text.includes("vue") ||
    text.includes("react") ||
    text.includes("next") ||
    text.includes("admin") ||
    text.includes("dashboard") ||
    text.includes("landing")
  ) {
    return "web";
  }

  return "other";
}

export async function fetchGitHubOrgRepos(rawInput: string): Promise<GitHubOrgResult> {
  const orgSlug = extractGitHubSlug(rawInput);
  if (!orgSlug) {
    throw new Error("Invalid GitHub organization name or URL");
  }

  const cacheKey = `github:org:${orgSlug.toLowerCase()}`;

  // 1. Check Redis Cache
  try {
    const cached = await get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as GitHubOrgResult;
    }
  } catch (err) {
    // Redis might be offline, fallback to memory
  }

  // 2. Check Memory Cache
  const memCached = memoryCache.get(cacheKey);
  if (memCached && memCached.expiresAt > Date.now()) {
    return memCached.data;
  }

  // 3. Fetch from GitHub API
  const token = process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    "User-Agent": "portofolio-v2-application",
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let apiUrl = `https://api.github.com/orgs/${encodeURIComponent(orgSlug)}/repos?sort=pushed&direction=desc&per_page=100`;
  let response = await fetch(apiUrl, { headers });

  // If 404 (not an org, but a user account), fallback to users endpoint
  if (response.status === 404) {
    apiUrl = `https://api.github.com/users/${encodeURIComponent(orgSlug)}/repos?sort=pushed&direction=desc&per_page=100`;
    response = await fetch(apiUrl, { headers });
  }

  if (!response.ok) {
    const errorText = await response.text();
    logger.warn({ status: response.status, errorText }, `GitHub API failed for ${orgSlug}`);
    throw new Error(`GitHub organization or user "${orgSlug}" not found (${response.status})`);
  }

  const rawRepos = (await response.json()) as any[];

  const repos: GitHubRepoItem[] = rawRepos
    .filter((r) => !r.private)
    .map((r) => {
      const appType = detectAppType(r.name || "", r.description || "", r.topics || [], r.language);
      return {
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        description: r.description || "",
        html_url: r.html_url,
        homepage: r.homepage || "",
        language: r.language || "",
        stars: r.stargazers_count || 0,
        forks: r.forks_count || 0,
        topics: Array.isArray(r.topics) ? r.topics : [],
        updated_at: r.updated_at,
        is_fork: Boolean(r.fork),
        archived: Boolean(r.archived),
        app_type: appType,
      };
    });

  const result: GitHubOrgResult = {
    org: orgSlug,
    org_url: `https://github.com/${orgSlug}`,
    avatar_url: `https://github.com/${orgSlug}.png`,
    total_repos: repos.length,
    repos,
  };

  // Cache for 1 hour (3600 seconds)
  try {
    await set(cacheKey, JSON.stringify(result), 3600);
  } catch (e) {
    // Redis might be offline, ignore
  }
  memoryCache.set(cacheKey, { data: result, expiresAt: Date.now() + 3600 * 1000 });

  return result;
}

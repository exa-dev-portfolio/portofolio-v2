import { getJson, setJson } from "~~/server/db/redis";
import { logger } from "~~/server/utils/logger";
import {
  getUserInteractionsMap,
  getUserBookmarks,
} from "~~/server/repositories/techRadar.repository";
import type {
  TechCategory,
  TechNewsItem,
  TechRadarStats,
} from "~~/app/types/tech-news";

const CACHE_KEY = "tech_radar:feed:v2";
const CACHE_TTL_SECONDS = 1800; // 30 minutes

// In-memory fallback in case Redis connection is idle/unavailable
let memoryFeedCache: { items: TechNewsItem[]; expiresAt: number } | null = null;

/**
 * Format timestamp into human-readable relative time (e.g., "2h ago", "15m ago")
 */
export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "Just now";

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const AI_REGEX = /\b(ai|llm|llms|gpt|claude|gemini|openai|anthropic|deepseek|ollama|neural|agent|agents|rag|huggingface|diffusion|copilot)\b|machine learning/i;
const MOBILE_REGEX = /\b(flutter|android|ios|swift|kotlin|dart|xcode)\b|react native|mobile app/i;
const WEB_REGEX = /\b(vue|nuxt|react|nextjs|next\.js|svelte|tailwind|css|javascript|typescript|vite|html)\b|frontend|web development/i;
const BACKEND_REGEX = /\b(golang|go lang|node\.js|nodejs|express|nestjs|rust|python|fastapi|django|postgres|postgresql|sql|database|redis|docker|kubernetes|k8s|devops|aws|microservice|microservices|backend)\b/i;
const TOOLS_REGEX = /\b(github|git|linux|neovim|vim|cli|terminal|ide)\b|open source/i;

/**
 * Smart categorizer based on title keywords and source tags
 */
export function classifyTechCategory(title: string, tags: string[] = []): TechCategory {
  const text = `${title} ${tags.join(" ")}`;

  // Check Web & Frontend first if explicit frontend terms are present
  if (WEB_REGEX.test(text)) {
    return "web";
  }

  // Check Mobile
  if (MOBILE_REGEX.test(text)) {
    return "mobile";
  }

  // Check AI & Machine Learning
  if (AI_REGEX.test(text)) {
    return "ai";
  }

  // Check Backend & Systems
  if (BACKEND_REGEX.test(text)) {
    return "backend";
  }

  // Check Tools & Open Source
  if (TOOLS_REGEX.test(text)) {
    return "tools";
  }

  return "general";
}

/**
 * Fetch top stories from Hacker News via Algolia CDN
 */
async function fetchHackerNewsStories(limit = 25): Promise<TechNewsItem[]> {
  try {
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) throw new Error(`HN status ${res.status}`);
    const data = await res.json();
    const hits = data?.hits ?? [];

    return hits
      .filter((h: any) => h.title)
      .map((h: any): TechNewsItem => {
        const url = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
        const tags = (h._tags || []).filter(
          (t: string) => t !== "story" && t !== "front_page"
        );
        return {
          id: `hn-${h.objectID}`,
          title: h.title,
          url,
          source: "Hacker News",
          category: classifyTechCategory(h.title, tags),
          author: h.author,
          published_at: h.created_at,
          time_ago: formatTimeAgo(h.created_at),
          score: h.points || 0,
          comments_count: h.num_comments || 0,
          summary: `Top discussion on Hacker News (${h.points || 0} points, ${h.num_comments || 0} comments).`,
          tags,
        };
      });
  } catch (error: any) {
    logger.warn({ err: error.message }, "[techNews.service] HackerNews fetch failed:");
    return [];
  }
}

/**
 * Fetch top developer articles from Dev.to
 */
async function fetchDevToArticles(limit = 25): Promise<TechNewsItem[]> {
  try {
    const res = await fetch(`https://dev.to/api/articles?per_page=${limit}&top=1`, {
      headers: { "User-Agent": "EkaPortfolio-TechRadar/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`Dev.to status ${res.status}`);
    const articles = await res.json();
    if (!Array.isArray(articles)) return [];

    return articles.map((a: any): TechNewsItem => {
      const tags = Array.isArray(a.tag_list)
        ? a.tag_list
        : typeof a.tags === "string"
        ? a.tags.split(",").map((s: string) => s.trim())
        : [];

      return {
        id: `devto-${a.id}`,
        title: a.title,
        url: a.url,
        source: "Dev.to",
        category: classifyTechCategory(a.title, tags),
        author: a.user?.name || "Dev Community",
        published_at: a.published_at || a.created_at,
        time_ago: formatTimeAgo(a.published_at || a.created_at),
        score: a.positive_reactions_count || 0,
        comments_count: a.comments_count || 0,
        summary: a.description || "",
        tags,
      };
    });
  } catch (error: any) {
    logger.warn({ err: error.message }, "[techNews.service] Dev.to fetch failed:");
    return [];
  }
}

/**
 * Fetch trending repositories from GitHub
 */
async function fetchGitHubTrending(limit = 15): Promise<TechNewsItem[]> {
  try {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    const dateQuery = d.toISOString().split("T")[0];

    const res = await fetch(
      `https://api.github.com/search/repositories?q=stars:>300+pushed:>${dateQuery}&sort=updated&order=desc&per_page=${limit}`,
      {
        headers: {
          "User-Agent": "EkaPortfolio-TechRadar/1.0",
          Accept: "application/vnd.github.v3+json",
        },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) throw new Error(`GitHub status ${res.status}`);
    const data = await res.json();
    const repos = data?.items ?? [];

    return repos.map((r: any): TechNewsItem => {
      const tags = [r.language, ...(r.topics || [])].filter(Boolean);
      return {
        id: `gh-${r.id}`,
        title: `${r.full_name}: ${r.description || "Trending repository on GitHub"}`,
        url: r.html_url,
        source: "GitHub",
        category: classifyTechCategory(
          `${r.name} ${r.description || ""}`,
          tags
        ),
        author: r.owner?.login,
        published_at: r.updated_at || r.created_at,
        time_ago: formatTimeAgo(r.updated_at),
        score: r.stargazers_count || 0,
        comments_count: r.forks_count || 0,
        summary: r.description || `Primary language: ${r.language || "Multi-language"}`,
        tags,
      };
    });
  } catch (error: any) {
    logger.warn({ err: error.message }, "[techNews.service] GitHub fetch failed:");
    return [];
  }
}

/**
 * Get aggregated raw tech feed from Cache or fetch in parallel
 */
export async function getAggregatedTechFeed(
  forceRefresh = false
): Promise<{ items: TechNewsItem[]; cached: boolean }> {
  const now = Date.now();

  // 1. Check Redis Cache
  if (!forceRefresh) {
    try {
      const cached = await getJson<TechNewsItem[]>(CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return { items: cached, cached: true };
      }
    } catch (_) {
      // Redis fallback
    }

    // 2. Check In-Memory Cache
    if (memoryFeedCache && memoryFeedCache.expiresAt > now) {
      return { items: memoryFeedCache.items, cached: true };
    }
  }

  logger.info("[techNews.service] Fetching fresh tech radar feeds from providers...");

  // 3. Fetch all sources in parallel with Promise.allSettled
  const results = await Promise.allSettled([
    fetchHackerNewsStories(30),
    fetchDevToArticles(30),
    fetchGitHubTrending(15),
  ]);

  const allItems: TechNewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      allItems.push(...r.value);
    }
  }

  // 4. Deduplicate by URL or normalized Title
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const uniqueItems: TechNewsItem[] = [];

  for (const item of allItems) {
    const cleanUrl = (item.url || "").trim().toLowerCase();
    const cleanTitle = (item.title || "").trim().toLowerCase().slice(0, 50);

    if (cleanUrl && seenUrls.has(cleanUrl)) continue;
    if (cleanTitle && seenTitles.has(cleanTitle)) continue;

    if (cleanUrl) seenUrls.add(cleanUrl);
    if (cleanTitle) seenTitles.add(cleanTitle);
    uniqueItems.push(item);
  }

  // 5. Interleave / Sort to mix sources and prioritize high scores
  uniqueItems.sort((a, b) => {
    const scoreA = (a.score || 0) + (a.comments_count || 0);
    const scoreB = (b.score || 0) + (b.comments_count || 0);
    return scoreB - scoreA;
  });

  // 6. Save to Redis & Memory Cache (30 min TTL)
  try {
    await setJson(CACHE_KEY, uniqueItems, CACHE_TTL_SECONDS);
  } catch (err: any) {
    logger.warn({ err: err.message }, "[techNews.service] Redis setJson error:");
  }

  memoryFeedCache = {
    items: uniqueItems,
    expiresAt: now + CACHE_TTL_SECONDS * 1000,
  };

  return { items: uniqueItems, cached: false };
}

/**
 * Fetch Tech Radar enriched with user database interactions (read status, bookmarks)
 */
export async function getUserTechRadar(
  userId: string,
  options: {
    category?: TechCategory;
    bookmarksOnly?: boolean;
    forceRefresh?: boolean;
    limit?: number;
  } = {}
): Promise<{
  items: TechNewsItem[];
  stats: TechRadarStats;
  cached: boolean;
}> {
  const { items: rawFeed, cached } = await getAggregatedTechFeed(
    options.forceRefresh
  );

  // 1. Fetch user interaction map from PostgreSQL
  const interactionsMap = await getUserInteractionsMap(userId);

  // 2. Fetch all user bookmarked articles from PostgreSQL (to ensure old bookmarks are never lost)
  const dbBookmarks = await getUserBookmarks(userId);
  const dbBookmarksMap = new Map<string, TechNewsItem>();

  for (const b of dbBookmarks) {
    dbBookmarksMap.set(b.article_id, {
      id: b.article_id,
      title: b.title,
      url: b.url,
      source: b.source as any,
      category: (b.category as TechCategory) || "general",
      author: b.author,
      published_at: b.published_at,
      time_ago: formatTimeAgo(b.published_at),
      is_read: b.is_read,
      is_bookmarked: true,
      tags: [],
    });
  }

  // 3. Enrich raw feed items with DB status
  const enrichedItems: TechNewsItem[] = rawFeed.map((item) => {
    const inter = interactionsMap.get(item.id);
    return {
      ...item,
      is_read: inter?.is_read ?? false,
      is_bookmarked: inter?.is_bookmarked ?? dbBookmarksMap.has(item.id),
    };
  });

  // If article in dbBookmarks is not present in rawFeed, prepend it to bookmarks view
  const feedIds = new Set(enrichedItems.map((i) => i.id));
  const missingBookmarks: TechNewsItem[] = [];
  for (const [id, bookmarkItem] of dbBookmarksMap.entries()) {
    if (!feedIds.has(id)) {
      missingBookmarks.push(bookmarkItem);
    }
  }

  // 4. Calculate Stats
  const totalBookmarked = dbBookmarks.length;
  let totalItems = enrichedItems.length;
  let unreadCount = enrichedItems.filter((i) => !i.is_read).length;

  // 5. Apply filters
  let filteredItems = enrichedItems;

  if (options.bookmarksOnly || options.category === "bookmarks") {
    filteredItems = [
      ...missingBookmarks,
      ...enrichedItems.filter((i) => i.is_bookmarked),
    ];
  } else if (options.category && options.category !== "all") {
    filteredItems = enrichedItems.filter(
      (i) => i.category === options.category
    );
  }

  if (options.limit && options.limit > 0) {
    filteredItems = filteredItems.slice(0, options.limit);
  }

  return {
    items: filteredItems,
    stats: {
      total: totalItems,
      unread: unreadCount,
      bookmarked: totalBookmarked,
      last_synced: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    cached,
  };
}

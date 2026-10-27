import { describe, it, expect } from "vitest";
import {
  classifyTechCategory,
  formatTimeAgo,
} from "~~/server/services/techNews.service";

describe("Tech News Service - Classifier & Utilities", () => {
  it("classifies AI topics correctly", () => {
    expect(classifyTechCategory("Anthropic introduces Claude 3.7 Sonnet")).toBe("ai");
    expect(classifyTechCategory("OpenAI reveals new reasoning LLM")).toBe("ai");
    expect(classifyTechCategory("Running DeepSeek locally with Ollama")).toBe("ai");
  });

  it("classifies Mobile topics correctly", () => {
    expect(classifyTechCategory("State management in Flutter 3.30")).toBe("mobile");
    expect(classifyTechCategory("Building Swift iOS apps with SwiftUI")).toBe("mobile");
    expect(classifyTechCategory("Android Jetpack Compose best practices")).toBe("mobile");
  });

  it("classifies Web & Frontend topics correctly", () => {
    expect(classifyTechCategory("What is new in Vue 3.5 and Nuxt 4")).toBe("web");
    expect(classifyTechCategory("React 19 Server Components deep dive")).toBe("web");
    expect(classifyTechCategory("Tailwind CSS v4 engine rewrite in Rust")).toBe("web");
  });

  it("classifies Backend & Systems topics correctly", () => {
    expect(classifyTechCategory("High performance API in Golang using Fiber")).toBe("backend");
    expect(classifyTechCategory("Scaling PostgreSQL connection pools with PgBouncer")).toBe("backend");
    expect(classifyTechCategory("Kubernetes cluster setup with Docker")).toBe("backend");
  });

  it("classifies Tools & Open Source topics correctly", () => {
    expect(classifyTechCategory("Git CLI tips for productive developers")).toBe("tools");
    expect(classifyTechCategory("Neovim 0.11 release highlights")).toBe("tools");
  });

  it("defaults to general for uncategorized topics", () => {
    expect(classifyTechCategory("Reflections on ten years of working remotely")).toBe("general");
  });

  it("formats relative time correctly", () => {
    expect(formatTimeAgo(undefined)).toBe("Recently");
    expect(formatTimeAgo("invalid-date-string")).toBe("Just now");

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(formatTimeAgo(tenMinutesAgo)).toBe("10m ago");

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(twoHoursAgo)).toBe("2h ago");

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(threeDaysAgo)).toBe("3d ago");
  });
});

import {
  techRadarArticleSchema,
  techRadarQuerySchema,
  techRadarBriefingSchema,
} from "~~/server/model/techRadar.model";

describe("Tech Radar - Zod Validation Schemas", () => {
  it("validates valid article input successfully", () => {
    const valid = {
      article_id: "hn-12345",
      title: "Anthropic Claude 3.7",
      url: "https://news.ycombinator.com/item?id=12345",
      source: "Hacker News",
      category: "ai",
      author: "alex",
      published_at: "2026-10-27T00:00:00Z",
    };
    const res = techRadarArticleSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("fails when required article fields are missing or invalid", () => {
    const invalidUrl = {
      article_id: "hn-12345",
      title: "Invalid Article",
      url: "not-a-valid-url",
      source: "Hacker News",
    };
    const res1 = techRadarArticleSchema.safeParse(invalidUrl);
    expect(res1.success).toBe(false);

    const missingTitle = {
      article_id: "hn-12345",
      url: "https://example.com",
      source: "Hacker News",
    };
    const res2 = techRadarArticleSchema.safeParse(missingTitle);
    expect(res2.success).toBe(false);
  });

  it("parses and transforms query parameters correctly", () => {
    const query = {
      category: "ai",
      bookmarks_only: "true",
      force_refresh: "1",
      limit: "25",
    };
    const res = techRadarQuerySchema.safeParse(query);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.category).toBe("ai");
      expect(res.data.bookmarks_only).toBe(true);
      expect(res.data.force_refresh).toBe(true);
      expect(res.data.limit).toBe(25);
    }
  });

  it("handles default values for query parameters", () => {
    const res = techRadarQuerySchema.safeParse({});
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.category).toBe("all");
      expect(res.data.bookmarks_only).toBe(false);
      expect(res.data.force_refresh).toBe(false);
      expect(res.data.limit).toBeUndefined();
    }
  });

  it("validates briefing schema defaults", () => {
    const res1 = techRadarBriefingSchema.safeParse({});
    expect(res1.success).toBe(true);
    if (res1.success) expect(res1.data.force).toBe(false);

    const res2 = techRadarBriefingSchema.safeParse({ force: true });
    expect(res2.success).toBe(true);
    if (res2.success) expect(res2.data.force).toBe(true);
  });
});


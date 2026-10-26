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

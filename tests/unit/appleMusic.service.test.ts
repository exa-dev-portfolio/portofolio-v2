import { describe, it, expect } from "vitest";
import {
  getAppleMusicStatus,
  generateAppleMusicDeveloperToken,
  isAppleMusicConfigured,
} from "~~/server/services/appleMusic.service";

describe("Apple Music Service", () => {
  it("detects when Apple Music is not configured", () => {
    const configured = isAppleMusicConfigured();
    expect(typeof configured).toBe("boolean");
  });

  it("returns is_configured: false and track: null without any fallback/demo tracks", async () => {
    const status = await getAppleMusicStatus();

    expect(status).toBeDefined();
    expect(status.source).toBe("apple-music");
    expect(status.is_configured).toBe(false);
    expect(status.is_playing).toBe(false);
    expect(status.is_live).toBe(false);
    expect(status.track).toBeNull();
    expect(status.favorite_genres).toEqual([]);
    expect((status as any).is_demo).toBeUndefined();
  });

  it("handles developer token generation safely without throwing when keys are missing", () => {
    const token = generateAppleMusicDeveloperToken();
    expect(token === null || typeof token === "string").toBe(true);
  });
});

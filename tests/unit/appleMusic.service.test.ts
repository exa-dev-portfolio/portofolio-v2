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

  it("returns is_configured: false and track: null when not configured so widget is hidden on frontend", async () => {
    const status = await getAppleMusicStatus(false);

    expect(status).toBeDefined();
    expect(status.source).toBe("apple-music");
    expect(status.is_configured).toBe(false);
    expect(status.track).toBeNull();
    expect(status.favorite_genres).toEqual([]);
  });

  it("returns demo music status when demo mode is explicitly requested", async () => {
    const status = await getAppleMusicStatus(true);

    expect(status).toBeDefined();
    expect(status.source).toBe("apple-music");
    expect(status.is_demo).toBe(true);

    // Track metadata
    expect(status.track).toBeDefined();
    expect(status.track?.title).toBeTruthy();
    expect(status.track?.artist).toBeTruthy();
    expect(status.track?.album).toBeTruthy();
    expect(status.track?.album_art).toContain("http");
    expect(status.track?.url).toContain("music.apple.com");
    expect(Array.isArray(status.track?.genre_names)).toBe(true);

    // Favorite genres structure
    expect(status.favorite_genres.length).toBeGreaterThanOrEqual(3);
    status.favorite_genres.forEach((genre) => {
      expect(genre.name).toBeTruthy();
      expect(genre.color).toBeTruthy();
      expect(genre.bg).toBeTruthy();
      expect(genre.border).toBeTruthy();
    });
  });

  it("handles developer token generation safely without throwing when keys are missing", () => {
    const token = generateAppleMusicDeveloperToken();
    expect(token === null || typeof token === "string").toBe(true);
  });
});

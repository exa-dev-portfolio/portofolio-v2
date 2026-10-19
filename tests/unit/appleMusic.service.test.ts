import { describe, it, expect } from "vitest";
import { getAppleMusicStatus, generateAppleMusicDeveloperToken } from "~~/server/services/appleMusic.service";

describe("Apple Music Service", () => {
  it("returns fallback demo music status with complete metadata when no credentials are configured", async () => {
    const status = await getAppleMusicStatus();

    expect(status).toBeDefined();
    expect(status.source).toBe("apple-music");
    expect(status.is_demo).toBe(true);

    // Track metadata
    expect(status.track).toBeDefined();
    expect(status.track.title).toBeTruthy();
    expect(status.track.artist).toBeTruthy();
    expect(status.track.album).toBeTruthy();
    expect(status.track.album_art).toContain("http");
    expect(status.track.url).toContain("music.apple.com");
    expect(Array.isArray(status.track.genre_names)).toBe(true);

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
    // In test environment without proper Apple keys, it should safely return null
    expect(token === null || typeof token === "string").toBe(true);
  });
});

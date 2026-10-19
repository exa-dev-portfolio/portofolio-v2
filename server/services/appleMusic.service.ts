import jwt from "jsonwebtoken";
import axios from "axios";
import { logger } from "../utils/logger";
import { getJson, setJson } from "../db/redis";
import type { AppleMusicNowPlayingResponse, FavoriteGenre, MusicTrack } from "~/types/music";
import { parsePrivateKey } from "./storeIntegration.service";

// In-memory cache when Redis is not available
let memoryCacheToken: { token: string; expiresAt: number } | null = null;
let memoryCacheData: { data: AppleMusicNowPlayingResponse; expiresAt: number } | null = null;

const CACHE_TTL_SECONDS = 30; // 30 seconds cache for now-playing
const DEV_TOKEN_CACHE_TTL = 86400; // 24 hours for developer token

/**
 * Generate Apple Music Developer Token (ES256 JWT)
 * Apple Developer Program MusicKit keys are valid for up to 180 days.
 */
export function generateAppleMusicDeveloperToken(): string | null {
  const config = useRuntimeConfig();

  const keyId = (config.appleMusicKeyId as string) || process.env.NUXT_APPLE_MUSIC_KEY_ID || process.env.APPLE_MUSIC_KEY_ID;
  const teamId = (config.appleMusicTeamId as string) || process.env.NUXT_APPLE_MUSIC_TEAM_ID || process.env.APPLE_MUSIC_TEAM_ID;
  const privateKey = (config.appleMusicPrivateKey as string) || process.env.NUXT_APPLE_MUSIC_PRIVATE_KEY || process.env.APPLE_MUSIC_PRIVATE_KEY;

  if (!keyId || !teamId || !privateKey) {
    return null;
  }

  // Check in-memory cache
  if (memoryCacheToken && memoryCacheToken.expiresAt > Date.now()) {
    return memoryCacheToken.token;
  }

  try {
    const formattedKey = parsePrivateKey(privateKey);
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (180 * 86400); // 180 days

    const payload = {
      iss: teamId.trim(),
      iat: now,
      exp: exp,
    };

    const token = jwt.sign(payload, formattedKey, {
      algorithm: "ES256",
      header: {
        alg: "ES256",
        kid: keyId.trim(),
        typ: "JWT",
      },
    });

    memoryCacheToken = {
      token,
      expiresAt: Date.now() + (DEV_TOKEN_CACHE_TTL * 1000),
    };

    return token;
  } catch (error: any) {
    logger.error({ err: error }, "[apple-music] Failed to generate developer token:");
    return null;
  }
}

/**
 * Maps raw Apple Music API track resource to MusicTrack format
 */
function mapAppleTrack(rawTrack: any): MusicTrack {
  const attrs = rawTrack.attributes || {};
  let artworkUrl = "";

  if (attrs.artwork?.url) {
    artworkUrl = attrs.artwork.url.replace("{w}x{h}", "600x600");
  }

  return {
    id: rawTrack.id || String(Date.now()),
    title: attrs.name || "Unknown Track",
    artist: attrs.artistName || "Unknown Artist",
    album: attrs.albumName || "Unknown Album",
    album_art: artworkUrl,
    url: attrs.url || "https://music.apple.com",
    preview_url: attrs.previews?.[0]?.url || null,
    duration_ms: attrs.durationInMillis || 0,
    progress_ms: 0,
    genre_names: attrs.genreNames || [],
    played_at: new Date().toISOString(),
  };
}

/**
 * Extract and score favorite genres from recent tracks
 */
function extractFavoriteGenres(tracks: MusicTrack[]): FavoriteGenre[] {
  const genreCount: Record<string, number> = {};

  tracks.forEach((track) => {
    track.genre_names.forEach((genre) => {
      const clean = genre.trim();
      if (clean && clean.toLowerCase() !== "music") {
        genreCount[clean] = (genreCount[clean] || 0) + 1;
      }
    });
  });

  const sortedGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const stylePresets = [
    { color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: "carbon:chart-line-smooth" },
    { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: "carbon:cloud" },
    { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "carbon:meter" },
    { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "carbon:headphones" },
    { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "carbon:music" },
  ];

  if (sortedGenres.length === 0) {
    return [];
  }

  return sortedGenres.map(([name, count], index) => {
    const preset = stylePresets[index % stylePresets.length];
    return {
      name,
      count,
      ...preset,
    };
  });
}

/**
 * Check whether Apple Music credentials are fully configured
 */
export function isAppleMusicConfigured(): boolean {
  const config = useRuntimeConfig();
  const keyId = (config.appleMusicKeyId as string) || process.env.NUXT_APPLE_MUSIC_KEY_ID || process.env.APPLE_MUSIC_KEY_ID;
  const teamId = (config.appleMusicTeamId as string) || process.env.NUXT_APPLE_MUSIC_TEAM_ID || process.env.APPLE_MUSIC_TEAM_ID;
  const privateKey = (config.appleMusicPrivateKey as string) || process.env.NUXT_APPLE_MUSIC_PRIVATE_KEY || process.env.APPLE_MUSIC_PRIVATE_KEY;
  const userToken = (config.appleMusicUserToken as string) || process.env.NUXT_APPLE_MUSIC_USER_TOKEN || process.env.APPLE_MUSIC_USER_TOKEN;

  return Boolean(
    keyId &&
    keyId.trim() &&
    teamId &&
    teamId.trim() &&
    privateKey &&
    privateKey.trim() &&
    userToken &&
    userToken.trim()
  );
}

/**
 * Fetch Now Playing / Recent Played from Apple Music API
 * Pure Apple Music data: returns null/empty if unconfigured or no tracks.
 */
export async function getAppleMusicStatus(): Promise<AppleMusicNowPlayingResponse> {
  const isConfigured = isAppleMusicConfigured();

  if (!isConfigured) {
    return {
      is_playing: false,
      is_live: false,
      is_configured: false,
      has_credentials: false,
      track: null,
      favorite_genres: [],
      source: "apple-music",
      status_message: "Apple Music not configured",
      updated_at: new Date().toISOString(),
    };
  }

  const cacheKey = "apple_music_status";

  // 1. Try Redis Cache
  try {
    const cached = await getJson<AppleMusicNowPlayingResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch {}

  // 2. Try In-Memory Cache
  if (memoryCacheData && memoryCacheData.expiresAt > Date.now()) {
    return memoryCacheData.data;
  }

  const config = useRuntimeConfig();
  const devToken = generateAppleMusicDeveloperToken();
  const userToken = (config.appleMusicUserToken as string) || process.env.NUXT_APPLE_MUSIC_USER_TOKEN || process.env.APPLE_MUSIC_USER_TOKEN;

  if (devToken && userToken && userToken.trim()) {
    try {
      const response = await axios.get("https://api.music.apple.com/v1/me/recent/played/tracks", {
        headers: {
          Authorization: `Bearer ${devToken}`,
          "Music-User-Token": userToken.trim(),
        },
        params: {
          limit: 10,
        },
        timeout: 6000,
      });

      const rawTracks = response.data?.data || [];
      if (rawTracks.length > 0) {
        const mappedTracks = rawTracks.map(mapAppleTrack);
        const currentTrack = mappedTracks[0];
        const favoriteGenres = extractFavoriteGenres(mappedTracks);

        const result: AppleMusicNowPlayingResponse = {
          is_playing: true,
          is_live: true,
          is_configured: true,
          has_credentials: true,
          track: currentTrack,
          favorite_genres: favoriteGenres,
          source: "apple-music",
          status_message: "Tuned in on Apple Music",
          updated_at: new Date().toISOString(),
        };

        // Save to cache
        await setJson(cacheKey, result, CACHE_TTL_SECONDS);
        memoryCacheData = {
          data: result,
          expiresAt: Date.now() + (CACHE_TTL_SECONDS * 1000),
        };

        return result;
      }
    } catch (err: any) {
      logger.warn({ err: err?.response?.data || err?.message }, "[apple-music] Failed to fetch live recent tracks:");
    }
  }

  // If call returned no tracks or failed, return empty state with no fallback/demo
  const emptyResult: AppleMusicNowPlayingResponse = {
    is_playing: false,
    is_live: false,
    is_configured: true,
    has_credentials: Boolean(devToken && userToken),
    track: null,
    favorite_genres: [],
    source: "apple-music",
    status_message: "No recent tracks found",
    updated_at: new Date().toISOString(),
  };

  return emptyResult;
}

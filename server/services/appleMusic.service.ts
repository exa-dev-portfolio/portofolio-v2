import jwt from "jsonwebtoken";
import axios from "axios";
import { logger } from "../utils/logger";
import { getJson, setJson } from "../db/redis";
import type { AppleMusicNowPlayingResponse, FavoriteGenre, MusicTrack } from "~/types/music";
import { parsePrivateKey } from "./storeIntegration.service";

// In-memory fallback cache when Redis is not available
let memoryCacheToken: { token: string; expiresAt: number } | null = null;
let memoryCacheData: { data: AppleMusicNowPlayingResponse; expiresAt: number } | null = null;

const CACHE_TTL_SECONDS = 30; // 30 seconds cache for now-playing
const DEV_TOKEN_CACHE_TTL = 86400; // 24 hours for developer token

/**
 * Curated fallback tracks for demo / offline mode
 */
const CURATED_DEMO_TRACKS: MusicTrack[] = [
  {
    id: "789506800",
    title: "Awake",
    artist: "Tycho",
    album: "Awake",
    album_art: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4a/62/16/4a6216c5-4a7b-3b36-7c05-b1a13e2df4bb/cover.jpg/600x600bb.jpg",
    url: "https://music.apple.com/id/album/awake/789506788?i=789506800",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/cf/e4/20/cfe4204d-e9c4-06d2-28e7-b6ca28994bb2/mzaf_13506148386377759868.plus.aac.p.m4a",
    duration_ms: 283000,
    progress_ms: 145000,
    genre_names: ["Electronic", "Ambient", "Downtempo"],
    played_at: new Date().toISOString(),
  },
  {
    id: "1440857782",
    title: "Starboy (feat. Daft Punk)",
    artist: "The Weeknd",
    album: "Starboy",
    album_art: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/09/a6/5c/09a65c27-33e9-74e2-6cf7-bc97e1740fb8/16UMGIM60699.rgb.jpg/600x600bb.jpg",
    url: "https://music.apple.com/id/album/starboy-feat-daft-punk/1440857781?i=1440857782",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/cb/bd/33/cbbd337f-5d41-523d-0e4c-1d0e51381be0/mzaf_10793136279511677353.plus.aac.p.m4a",
    duration_ms: 230453,
    progress_ms: 98000,
    genre_names: ["R&B/Soul", "Contemporary R&B", "Pop"],
    played_at: new Date().toISOString(),
  },
  {
    id: "925239967",
    title: "Dayvan Cowboy",
    artist: "Boards of Canada",
    album: "The Campfire Headphase",
    album_art: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/28/62/7f/28627f12-0545-0d69-652a-923f6c8d41e2/801061012330.png/600x600bb.jpg",
    url: "https://music.apple.com/id/album/dayvan-cowboy/925239960?i=925239967",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/8e/3c/6f/8e3c6f45-0fcb-82ad-db5a-334360e2ce1c/mzaf_16259021870638531776.plus.aac.p.m4a",
    duration_ms: 300000,
    progress_ms: 82000,
    genre_names: ["Electronic", "IDM", "Ambient"],
    played_at: new Date().toISOString(),
  }
];

const DEFAULT_FAVORITE_GENRES: FavoriteGenre[] = [
  {
    name: "Synthwave / Cyberpunk",
    icon: "carbon:chart-line-smooth",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    count: 38,
  },
  {
    name: "Ambient & Downtempo",
    icon: "carbon:cloud",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    count: 32,
  },
  {
    name: "Electronic & IDM",
    icon: "carbon:meter",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    count: 27,
  },
  {
    name: "Lo-Fi Coding Beats",
    icon: "carbon:headphones",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    count: 24,
  },
  {
    name: "Indie & Alternative",
    icon: "carbon:music",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    count: 18,
  },
];

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
  let artworkUrl = "/images/apple-music-fallback.webp";

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
    progress_ms: Math.floor((attrs.durationInMillis || 240000) * 0.45),
    genre_names: attrs.genreNames || [],
    played_at: attrs.playParams?.purchasedId ? new Date().toISOString() : new Date().toISOString(),
  };
}

/**
 * Extract and score favorite genres from recent tracks
 */
function extractFavoriteGenres(tracks: MusicTrack[]): FavoriteGenre[] {
  const genreCount: Record<string, number> = {};

  tracks.forEach((track) => {
    track.genre_names.forEach((genre) => {
      // Normalize genre name
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
    return DEFAULT_FAVORITE_GENRES;
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
 * If not configured and includeDemo is false, returns is_configured: false and track: null
 */
export async function getAppleMusicStatus(includeDemo = false): Promise<AppleMusicNowPlayingResponse> {
  const isConfigured = isAppleMusicConfigured();

  // If credentials are NOT configured and demo is NOT explicitly requested, hide music (unconfigured)
  if (!isConfigured && !includeDemo) {
    return {
      is_playing: false,
      is_live: false,
      is_demo: false,
      is_configured: false,
      has_credentials: false,
      track: null,
      favorite_genres: [],
      source: "apple-music",
      status_message: "Apple Music not configured",
      updated_at: new Date().toISOString(),
    };
  }

  const cacheKey = includeDemo ? "apple_music_status_demo" : "apple_music_status";

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

  // If credentials are present, attempt live Apple Music API call
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
          is_demo: false,
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
      logger.warn({ err: err?.response?.data || err?.message }, "[apple-music] Live API call failed, falling back to simulated demo:");
    }
  }

  // Fallback demo mode (when includeDemo is true or credentials were provided but call failed)
  const randomTrack = CURATED_DEMO_TRACKS[Math.floor(Math.random() * CURATED_DEMO_TRACKS.length)];
  const result: AppleMusicNowPlayingResponse = {
    is_playing: true,
    is_live: false,
    is_demo: true,
    is_configured: isConfigured,
    has_credentials: Boolean(devToken && userToken),
    track: randomTrack,
    favorite_genres: DEFAULT_FAVORITE_GENRES,
    source: "apple-music",
    status_message: "Developer Soundtrack • Apple Music",
    updated_at: new Date().toISOString(),
  };

  // Cache fallback for 15 seconds
  try {
    await setJson(cacheKey, result, 15);
  } catch {}
  memoryCacheData = {
    data: result,
    expiresAt: Date.now() + 15000,
  };

  return result;
}

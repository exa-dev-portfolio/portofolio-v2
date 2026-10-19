export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  album_art: string;
  url: string;
  preview_url: string | null;
  duration_ms: number;
  progress_ms: number;
  genre_names: string[];
  played_at?: string | null;
}

export interface FavoriteGenre {
  name: string;
  icon?: string;
  color?: string;
  bg?: string;
  border?: string;
  count?: number;
}

export interface AppleMusicNowPlayingResponse {
  is_playing: boolean;
  is_live: boolean;
  is_demo: boolean;
  track: MusicTrack;
  favorite_genres: FavoriteGenre[];
  source: 'apple-music';
  status_message: string;
  has_credentials: boolean;
  updated_at: string;
}

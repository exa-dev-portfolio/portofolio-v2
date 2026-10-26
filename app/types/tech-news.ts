export type TechCategory = 'all' | 'ai' | 'web' | 'backend' | 'mobile' | 'tools' | 'general' | 'bookmarks';

export interface TechNewsItem {
  id: string;
  title: string;
  url: string;
  source: 'Hacker News' | 'Dev.to' | 'GitHub' | 'TechFeed';
  category: TechCategory;
  author?: string;
  published_at?: string;
  time_ago?: string;
  score?: number;
  comments_count?: number;
  summary?: string;
  tags?: string[];
  is_read?: boolean;
  is_bookmarked?: boolean;
}

export interface TechRadarStats {
  total: number;
  unread: number;
  bookmarked: number;
  last_synced: string;
}

export interface TechRadarResponseData {
  items: TechNewsItem[];
  stats: TechRadarStats;
  cached: boolean;
}

export interface DailyBriefingResponse {
  headline: string;
  takeaways: { title: string; desc: string; tag: string }[];
  market_pulse: string;
  generated_at: string;
}

import { query } from "~~/server/db/postgres";
import { logger } from "~~/server/utils/logger";

export interface TechRadarInteractionRecord {
  id: number;
  user_id: string;
  article_id: string;
  title: string;
  url: string;
  source: string;
  category?: string;
  author?: string;
  published_at?: string;
  is_read: boolean;
  read_at?: string;
  is_bookmarked: boolean;
  bookmarked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertArticleInput {
  article_id: string;
  title: string;
  url: string;
  source: string;
  category?: string;
  author?: string;
  published_at?: string;
}

/**
 * Get map of user interactions (is_read, is_bookmarked) for rapid O(1) lookups
 */
export async function getUserInteractionsMap(
  userId: string
): Promise<Map<string, { is_read: boolean; is_bookmarked: boolean }>> {
  try {
    const sql = `
      SELECT article_id, is_read, is_bookmarked 
      FROM tech_radar_interactions 
      WHERE user_id = $1
    `;
    const result = await query<{
      article_id: string;
      is_read: boolean;
      is_bookmarked: boolean;
    }>(sql, [userId]);

    const map = new Map<string, { is_read: boolean; is_bookmarked: boolean }>();
    for (const row of result.rows) {
      map.set(row.article_id, {
        is_read: row.is_read,
        is_bookmarked: row.is_bookmarked,
      });
    }
    return map;
  } catch (error: any) {
    logger.warn({ err: error.message }, "[techRadar.repository] getUserInteractionsMap error:");
    return new Map();
  }
}

/**
 * Mark article as read in PostgreSQL
 */
export async function markArticleAsRead(
  userId: string,
  article: UpsertArticleInput
): Promise<boolean> {
  try {
    const sql = `
      INSERT INTO tech_radar_interactions (
        user_id, article_id, title, url, source, category, author, published_at, is_read, read_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, article_id)
      DO UPDATE SET
        is_read = true,
        read_at = COALESCE(tech_radar_interactions.read_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    const values = [
      userId,
      article.article_id,
      article.title,
      article.url,
      article.source,
      article.category || null,
      article.author || null,
      article.published_at || null,
    ];

    const result = await query(sql, values);
    return (result.rowCount ?? 0) > 0;
  } catch (error: any) {
    logger.error({ err: error.message }, "[techRadar.repository] markArticleAsRead error:");
    throw error;
  }
}

/**
 * Toggle bookmark state in PostgreSQL
 */
export async function toggleArticleBookmark(
  userId: string,
  article: UpsertArticleInput
): Promise<boolean> {
  try {
    const sql = `
      INSERT INTO tech_radar_interactions (
        user_id, article_id, title, url, source, category, author, published_at, is_bookmarked, bookmarked_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, article_id)
      DO UPDATE SET
        is_bookmarked = NOT tech_radar_interactions.is_bookmarked,
        bookmarked_at = CASE 
          WHEN NOT tech_radar_interactions.is_bookmarked THEN CURRENT_TIMESTAMP 
          ELSE NULL 
        END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING is_bookmarked
    `;
    const values = [
      userId,
      article.article_id,
      article.title,
      article.url,
      article.source,
      article.category || null,
      article.author || null,
      article.published_at || null,
    ];

    const result = await query<{ is_bookmarked: boolean }>(sql, values);
    return result.rows[0]?.is_bookmarked ?? false;
  } catch (error: any) {
    logger.error({ err: error.message }, "[techRadar.repository] toggleArticleBookmark error:");
    throw error;
  }
}

/**
 * Get all bookmarked articles for the user
 */
export async function getUserBookmarks(
  userId: string
): Promise<TechRadarInteractionRecord[]> {
  try {
    const sql = `
      SELECT * FROM tech_radar_interactions
      WHERE user_id = $1 AND is_bookmarked = true
      ORDER BY bookmarked_at DESC NULLS LAST, created_at DESC
    `;
    const result = await query<TechRadarInteractionRecord>(sql, [userId]);
    return result.rows;
  } catch (error: any) {
    logger.error({ err: error.message }, "[techRadar.repository] getUserBookmarks error:");
    return [];
  }
}

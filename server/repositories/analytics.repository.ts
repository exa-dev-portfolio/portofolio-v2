import type { PoolClient } from 'pg';

export interface AnalyticsEventInput {
  session_id: string;
  event_type?: string;
  path: string;
  title?: string;
  referrer?: string;
  referrer_domain?: string;
  device_type?: string;
  os?: string;
  browser?: string;
  country?: string;
  duration_seconds?: number;
}

export async function insertEvent(client: PoolClient, event: AnalyticsEventInput): Promise<any> {
  const query = `
    INSERT INTO analytics_events (
      session_id, event_type, path, title, referrer, referrer_domain,
      device_type, os, browser, country, duration_seconds, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    RETURNING id, created_at
  `;
  const values = [
    event.session_id,
    event.event_type || 'page_view',
    event.path,
    event.title || null,
    event.referrer || null,
    event.referrer_domain || 'Direct',
    event.device_type || 'desktop',
    event.os || 'Unknown',
    event.browser || 'Unknown',
    event.country || null,
    event.duration_seconds || 0,
  ];

  const res = await client.query(query, values);
  return res.rows[0];
}

export async function getSummaryMetrics(client: PoolClient, startDate: Date, endDate: Date) {
  const query = `
    WITH period_stats AS (
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT session_id) as total_visitors,
        AVG(duration_seconds) as avg_duration
      FROM analytics_events
      WHERE created_at >= $1 AND created_at <= $2
        AND event_type = 'page_view'
    ),
    single_page_sessions AS (
      SELECT session_id
      FROM analytics_events
      WHERE created_at >= $1 AND created_at <= $2
        AND event_type = 'page_view'
      GROUP BY session_id
      HAVING COUNT(*) = 1
    )
    SELECT 
      COALESCE(p.total_views, 0)::int as total_views,
      COALESCE(p.total_visitors, 0)::int as total_visitors,
      COALESCE(ROUND(p.avg_duration), 0)::int as avg_duration,
      (SELECT COUNT(*)::int FROM single_page_sessions) as single_sessions
    FROM period_stats p;
  `;

  const res = await client.query(query, [startDate, endDate]);
  const row = res.rows[0] || { total_views: 0, total_visitors: 0, avg_duration: 0, single_sessions: 0 };
  
  const bounceRate = row.total_visitors > 0 
    ? Math.round((row.single_sessions / row.total_visitors) * 100) 
    : 0;

  return {
    totalViews: row.total_views,
    totalVisitors: row.total_visitors,
    avgDuration: row.avg_duration,
    bounceRate: `${bounceRate}%`,
  };
}

export async function getDailyTraffic(client: PoolClient, startDate: Date, endDate: Date) {
  const query = `
    SELECT 
      TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') as date_key,
      TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta', 'Dy') as day_label,
      TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta', 'DD Mon') as display_date,
      COUNT(*)::int as views,
      COUNT(DISTINCT session_id)::int as visitors
    FROM analytics_events
    WHERE created_at >= $1 AND created_at <= $2
      AND event_type = 'page_view'
    GROUP BY date_key, day_label, display_date
    ORDER BY date_key ASC;
  `;

  const res = await client.query(query, [startDate, endDate]);
  return res.rows;
}

export async function getTopPages(client: PoolClient, startDate: Date, endDate: Date, limit = 8) {
  const query = `
    WITH total AS (
      SELECT COUNT(*)::float as total_views
      FROM analytics_events
      WHERE created_at >= $1 AND created_at <= $2 AND event_type = 'page_view'
    )
    SELECT 
      e.path,
      COALESCE(NULLIF(MAX(e.title), ''), e.path) as title,
      COUNT(*)::int as views,
      COUNT(DISTINCT e.session_id)::int as visitors,
      CASE 
        WHEN (SELECT total_views FROM total) > 0 
        THEN ROUND((COUNT(*)::numeric / (SELECT total_views FROM total)::numeric) * 100, 1)::float
        ELSE 0
      END as percentage
    FROM analytics_events e
    WHERE e.created_at >= $1 AND e.created_at <= $2
      AND e.event_type = 'page_view'
    GROUP BY e.path
    ORDER BY views DESC
    LIMIT $3;
  `;

  const res = await client.query(query, [startDate, endDate, limit]);
  return res.rows;
}

export async function getTopReferrers(client: PoolClient, startDate: Date, endDate: Date, limit = 6) {
  const query = `
    WITH total AS (
      SELECT COUNT(*)::float as total_visits
      FROM analytics_events
      WHERE created_at >= $1 AND created_at <= $2 AND event_type = 'page_view'
    )
    SELECT 
      COALESCE(NULLIF(referrer_domain, ''), 'Direct') as source,
      COUNT(*)::int as visits,
      CASE 
        WHEN (SELECT total_visits FROM total) > 0 
        THEN ROUND((COUNT(*)::numeric / (SELECT total_visits FROM total)::numeric) * 100, 1)::float
        ELSE 0
      END as percentage
    FROM analytics_events
    WHERE created_at >= $1 AND created_at <= $2
      AND event_type = 'page_view'
    GROUP BY source
    ORDER BY visits DESC
    LIMIT $3;
  `;

  const res = await client.query(query, [startDate, endDate, limit]);
  return res.rows;
}

export async function getDeviceBreakdown(client: PoolClient, startDate: Date, endDate: Date) {
  const query = `
    WITH total AS (
      SELECT COUNT(*)::float as total_count
      FROM analytics_events
      WHERE created_at >= $1 AND created_at <= $2 AND event_type = 'page_view'
    )
    SELECT 
      device_type as device,
      COUNT(*)::int as count,
      CASE 
        WHEN (SELECT total_count FROM total) > 0 
        THEN ROUND((COUNT(*)::numeric / (SELECT total_count FROM total)::numeric) * 100, 1)::float
        ELSE 0
      END as percentage
    FROM analytics_events
    WHERE created_at >= $1 AND created_at <= $2
      AND event_type = 'page_view'
    GROUP BY device_type
    ORDER BY count DESC;
  `;

  const res = await client.query(query, [startDate, endDate]);
  return res.rows;
}

export async function getOsBreakdown(client: PoolClient, startDate: Date, endDate: Date, limit = 5) {
  const query = `
    WITH total AS (
      SELECT COUNT(*)::float as total_count
      FROM analytics_events
      WHERE created_at >= $1 AND created_at <= $2 AND event_type = 'page_view'
    )
    SELECT 
      COALESCE(NULLIF(os, ''), 'Other') as os,
      COUNT(*)::int as count,
      CASE 
        WHEN (SELECT total_count FROM total) > 0 
        THEN ROUND((COUNT(*)::numeric / (SELECT total_count FROM total)::numeric) * 100, 1)::float
        ELSE 0
      END as percentage
    FROM analytics_events
    WHERE created_at >= $1 AND created_at <= $2
      AND event_type = 'page_view'
    GROUP BY os
    ORDER BY count DESC
    LIMIT $3;
  `;

  const res = await client.query(query, [startDate, endDate, limit]);
  return res.rows;
}

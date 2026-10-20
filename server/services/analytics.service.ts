import { withTransaction } from '../db/postgres';
import * as analyticsRepo from '../repositories/analytics.repository';
import { createHash } from 'crypto';

export interface RecordHitPayload {
  path: string;
  title?: string;
  referrer?: string;
  event_type?: string;
  duration_seconds?: number;
  session_id?: string;
}

/**
 * Clean and normalize referrer URL into a recognizable domain / source name
 */
export function parseReferrerDomain(referrer?: string, currentHost?: string): string {
  if (!referrer || !referrer.trim()) return 'Direct';

  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    // Ignore self-referrals
    if (currentHost && (host === currentHost.toLowerCase() || host.includes('eka-dev.cloud') || host.includes('localhost'))) {
      return 'Direct';
    }

    if (host.includes('google.')) return 'Google';
    if (host.includes('github.com')) return 'GitHub';
    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('t.co') || host.includes('twitter.com') || host.includes('x.com')) return 'X / Twitter';
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('youtube.com')) return 'YouTube';
    if (host.includes('facebook.com')) return 'Facebook';
    if (host.includes('reddit.com')) return 'Reddit';
    if (host.includes('bing.com')) return 'Bing';

    return host;
  } catch {
    return 'Direct';
  }
}

/**
 * Fast, lightweight user agent parser for Device, OS, and Browser
 */
export function parseUserAgent(ua?: string): { device: string; os: string; browser: string } {
  if (!ua || !ua.trim()) {
    return { device: 'desktop', os: 'Unknown', browser: 'Unknown' };
  }

  const u = ua.toLowerCase();

  // Device Detection
  let device = 'desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    device = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) {
    device = 'mobile';
  }

  // OS Detection
  let os = 'Other';
  if (u.includes('iphone') || u.includes('ipad') || u.includes('ipod')) os = 'iOS';
  else if (u.includes('macintosh') || u.includes('mac os x')) os = 'macOS';
  else if (u.includes('android')) os = 'Android';
  else if (u.includes('windows')) os = 'Windows';
  else if (u.includes('linux')) os = 'Linux';
  else if (u.includes('cros')) os = 'Chrome OS';

  // Browser Detection
  let browser = 'Other';
  if (u.includes('edg/') || u.includes('edge/')) browser = 'Edge';
  else if (u.includes('opr/') || u.includes('opera')) browser = 'Opera';
  else if (u.includes('samsungbrowser')) browser = 'Samsung Browser';
  else if (u.includes('chrome') && !u.includes('chromium')) browser = 'Chrome';
  else if (u.includes('safari') && !u.includes('chrome')) browser = 'Safari';
  else if (u.includes('firefox')) browser = 'Firefox';

  return { device, os, browser };
}

/**
 * Generates a privacy-preserving session ID based on IP + UA + Daily Salt
 */
export function generateSessionId(ip: string, userAgent: string, providedSessionId?: string): string {
  if (providedSessionId && providedSessionId.length >= 16) {
    return providedSessionId.slice(0, 64);
  }

  const today = new Date().toISOString().slice(0, 10);
  const raw = `${ip}_${userAgent}_${today}_portfolio_salt`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

/**
 * Record an analytics hit (pageview or telemetry event)
 */
export async function trackEvent(payload: RecordHitPayload, headers: Record<string, any>, clientIp: string) {
  // Ignore dashboard routes to avoid recording developer/admin activities
  if (payload.path && payload.path.startsWith('/dashboard')) {
    return { skipped: true, reason: 'dashboard_route' };
  }

  const ua = headers['user-agent'] || '';
  const host = headers['host'] || '';
  const { device, os, browser } = parseUserAgent(ua);
  const referrerDomain = parseReferrerDomain(payload.referrer, host);
  const sessionId = generateSessionId(clientIp, ua, payload.session_id);

  return withTransaction(async (client) => {
    return await analyticsRepo.insertEvent(client, {
      session_id: sessionId,
      event_type: payload.event_type || 'page_view',
      path: payload.path || '/',
      title: payload.title || undefined,
      referrer: payload.referrer || undefined,
      referrer_domain: referrerDomain,
      device_type: device,
      os,
      browser,
      duration_seconds: payload.duration_seconds || 0,
    });
  });
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function calculateChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * Fetch aggregated dashboard analytics metrics for specified range
 */
export async function getDashboardAnalytics(range: string = '30days') {
  const now = new Date();
  let days = 30;

  if (range === '7days') days = 7;
  else if (range === '90days') days = 90;
  else if (range === 'all') days = 365;

  const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevEnd = new Date(currentStart.getTime());
  const prevStart = new Date(prevEnd.getTime() - days * 24 * 60 * 60 * 1000);

  return withTransaction(async (client) => {
    // Current period & Previous period metrics for trend calculation
    const currentSummary = await analyticsRepo.getSummaryMetrics(client, currentStart, now);
    const prevSummary = await analyticsRepo.getSummaryMetrics(client, prevStart, prevEnd);

    // Timeseries data for chart
    const rawTimeseries = await analyticsRepo.getDailyTraffic(client, currentStart, now);

    // Build complete daily timeline map (fill days with zero if no visits)
    const timeseriesMap = new Map<string, { views: number; visitors: number; day_label: string; display_date: string }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      timeseriesMap.set(dateKey, { views: 0, visitors: 0, day_label: dayLabel, display_date: displayDate });
    }

    for (const row of rawTimeseries) {
      if (timeseriesMap.has(row.date_key)) {
        timeseriesMap.set(row.date_key, {
          views: row.views,
          visitors: row.visitors,
          day_label: row.day_label,
          display_date: row.display_date,
        });
      }
    }

    const trafficData = Array.from(timeseriesMap.entries()).map(([dateKey, val]) => ({
      date: dateKey,
      day: val.day_label,
      displayDate: val.display_date,
      views: val.views,
      visitors: val.visitors,
    }));

    // Breakdowns
    const topPages = await analyticsRepo.getTopPages(client, currentStart, now, 8);
    const topReferrers = await analyticsRepo.getTopReferrers(client, currentStart, now, 6);
    const deviceBreakdown = await analyticsRepo.getDeviceBreakdown(client, currentStart, now);
    const osBreakdown = await analyticsRepo.getOsBreakdown(client, currentStart, now, 5);

    const topDevice = deviceBreakdown.length > 0
      ? `${deviceBreakdown[0].device} (${deviceBreakdown[0].percentage}%)`
      : 'Desktop (100%)';

    return {
      summary: {
        totalVisitors: currentSummary.totalVisitors,
        visitorsChange: calculateChange(currentSummary.totalVisitors, prevSummary.totalVisitors),
        pageViews: currentSummary.totalViews,
        pageViewsChange: calculateChange(currentSummary.totalViews, prevSummary.totalViews),
        bounceRate: currentSummary.bounceRate,
        bounceRateChange: calculateChange(parseInt(currentSummary.bounceRate), parseInt(prevSummary.bounceRate) || 0),
        avgDuration: formatDuration(currentSummary.avgDuration),
        avgDurationChange: calculateChange(currentSummary.avgDuration, prevSummary.avgDuration),
        topDevice,
      },
      trafficData,
      topPages,
      topReferrers,
      deviceBreakdown,
      osBreakdown,
    };
  });
}

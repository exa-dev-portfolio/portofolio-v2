import { sendSuccess } from '~~/server/utils/response';
import * as analyticsService from '~~/server/services/analytics.service';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}));
    const headers = getRequestHeaders(event);
    const clientIp = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1';

    const result = await analyticsService.trackEvent(
      {
        path: body.path || '/',
        title: body.title,
        referrer: body.referrer,
        event_type: body.event_type || 'page_view',
        duration_seconds: body.duration_seconds || 0,
        session_id: body.session_id,
      },
      headers,
      clientIp
    );

    return sendSuccess(event, result, 'Analytics event tracked', 'event_tracked');
  } catch (err: any) {
    // Analytics tracking should fail silently to avoid ever impacting user experience
    return sendSuccess(event, { tracked: false, error: err?.message }, 'Tracking processed with fallback', 'event_skipped');
  }
});

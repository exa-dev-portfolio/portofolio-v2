export default defineNuxtPlugin((nuxtApp) => {
  // Ensure we are in client browser environment
  if (!import.meta.client) return;

  // Generate or retrieve persistent pseudonymous session ID
  const STORAGE_KEY = 'eka_sid';
  let sessionId = '';
  try {
    sessionId = localStorage.getItem(STORAGE_KEY) || '';
    if (!sessionId || sessionId.length < 16) {
      sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '')
        : `${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
  } catch {
    sessionId = `${Date.now()}_fallback`;
  }

  let lastTrackedPath = '';

  const sendEvent = (payload: {
    path: string;
    title?: string;
    referrer?: string;
    event_type?: string;
    duration_seconds?: number;
  }) => {
    // Never track admin dashboard pages
    if (payload.path && payload.path.startsWith('/dashboard')) {
      return;
    }

    const data = JSON.stringify({
      ...payload,
      session_id: sessionId,
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/track', blob);
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Ignore background analytics transport errors
    }
  };

  const trackPageView = (toPath: string, fromPath?: string) => {
    if (toPath === lastTrackedPath) return;
    lastTrackedPath = toPath;

    sendEvent({
      path: toPath,
      title: typeof document !== 'undefined' ? document.title : '',
      referrer: fromPath ? `${window.location.origin}${fromPath}` : (typeof document !== 'undefined' ? document.referrer : ''),
      event_type: 'page_view',
    });
  };

  // Initial page hit once Nuxt app is ready
  nuxtApp.hook('app:mounted', () => {
    trackPageView(window.location.pathname);
  });

  // Client-side SPA route transitions
  const router = useRouter();
  router.afterEach((to, from) => {
    trackPageView(to.path, from.path);
  });

  // Expose manual telemetry trigger for custom actions (resume download, music play, app download)
  return {
    provide: {
      trackEvent: (eventType: string, meta?: { path?: string; title?: string }) => {
        sendEvent({
          path: meta?.path || window.location.pathname,
          title: meta?.title || (typeof document !== 'undefined' ? document.title : ''),
          event_type: eventType,
        });
      },
    },
  };
});

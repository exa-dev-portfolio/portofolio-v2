export default defineNuxtRouteMiddleware((to) => {
  // Only evaluate on client-side where display-mode and sessionStorage exist
  if (import.meta.server) return

  // Detect whether running in PWA standalone mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    to.query.source === 'pwa'

  if (!isStandalone) return

  // Check if initial session routing has already been processed
  const isPwaSessionActive = sessionStorage.getItem('pwa_session_initialized')

  // If this is the initial launch ("dari awal")
  if (!isPwaSessionActive) {
    sessionStorage.setItem('pwa_session_initialized', '1')

    // On initial PWA launch, do not land on the public landing page ("/")
    // Instead, route directly to the dashboard / console.
    // (If user is unauthenticated, auth.global middleware handles routing to /login)
    if (to.path === '/') {
      return navigateTo({
        path: '/dashboard',
        query: { ...to.query, source: 'pwa' },
      })
    }
  }

  // Once initialized, user is free to navigate to "/" (landing page) or any other route
})


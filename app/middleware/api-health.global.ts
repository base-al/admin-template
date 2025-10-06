export default defineNuxtRouteMiddleware(async (to, _from) => {
  // Skip middleware on server-side rendering
  if (import.meta.server) return

  // Don't check API health for error pages, auth pages, or static assets
  const allowedPaths = [
    '/error/api-connection',
    '/auth/login',
    '/auth/register',
    '/_nuxt',
    '/__nuxt_error'
  ]

  // Check if current path should be excluded from API health checks
  if (allowedPaths.some(path => to.path.startsWith(path))) {
    return
  }

  // For client-side navigation, do a quick health check
  const apiHealth = useApiHealth()
  
  // If we're navigating to an app page, do a quick health check
  if (to.path.startsWith('/app/')) {
    try {
      // Quick health check without error handling to detect connection issues
      await apiHealth.checkApiHealth(true) // silent check
    } catch {
      // If health check fails, redirect to error page
      console.log('API health check failed, redirecting to error page')
      return navigateTo('/error/api-connection')
    }
  }
  
  // If API is known to be unhealthy and we're not going to error page
  if (!apiHealth.health.value.isHealthy && to.path !== '/error/api-connection') {
    return navigateTo('/error/api-connection')
  }
})
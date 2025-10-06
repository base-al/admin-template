// API Error type definitions
interface ApiError {
  name?: string
  message?: string
  statusCode?: number
  code?: string
  [key: string]: unknown
}

export default defineNuxtPlugin(() => {
 
  const route = useRoute()

  // Global error handler for uncaught API errors
  const handleGlobalError = (error: unknown) => {
    // Check if this is an API-related error
    if (isApiError(error)) {
      console.error('API Error detected:', error)
      
      // Don't try to update health status directly - let the health check handle it
      console.log('API health will be updated on next check')
      
      // Don't redirect if already on error page
      if (route.path !== '/error/api-connection') {
        navigateTo('/error/api-connection')
      }
    }
  }

  // Check if error is API-related
  const isApiError = (error: unknown): error is ApiError => {
    if (!error || typeof error !== 'object') return false
    const err = error as ApiError
    // Network/connection errors
    if (err.name === 'FetchError') return true
    
    // Server errors that indicate API problems
    if (typeof err.statusCode === 'number' && err.statusCode >= 500) return true
    
    // Connection refused, timeout, etc.
    if (err.code && ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ENETUNREACH'].includes(err.code)) {
      return true
    }
    
    // Error message contains connection-related keywords
    if (err.message && /connection|network|timeout|refused|unavailable/i.test(err.message)) {
      return true
    }
    
    return false
  }
 
  // Listen for global errors
  if (import.meta.client) {
    window.addEventListener('unhandledrejection', (event) => {
      handleGlobalError(event.reason)
    })

    window.addEventListener('error', (event) => {
      handleGlobalError(event.error)
    })
  }

  // Provide global error handler
  return {
    provide: {
      handleApiError: handleGlobalError
    }
  }
})
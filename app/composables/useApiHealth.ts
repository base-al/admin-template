export interface ApiHealthStatus {
  isHealthy: boolean
  isChecking: boolean
  lastError: string | null
  lastChecked: Date | null
  retryAttempts: number
}

export const useApiHealth = () => {
  const health = ref<ApiHealthStatus>({
    isHealthy: true,
    isChecking: false,
    lastError: null,
    lastChecked: null,
    retryAttempts: 0
  })

  const MAX_RETRY_ATTEMPTS = 3
  const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
  const RETRY_DELAY = 5000 // 5 seconds

  let healthCheckInterval: NodeJS.Timeout | null = null
  let retryTimeout: NodeJS.Timeout | null = null

  const checkApiHealth = async (silent = false) => {
    if (health.value.isChecking && !silent) return
    
    health.value.isChecking = true
    
    try {
      const _api = useApi()
      // Simple health check with timeout - try to fetch a basic endpoint
      // Skip error handling to avoid infinite loops
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      try {
        // Use proxy for health check to avoid CORS issues
        await $fetch('/health', {
          signal: controller.signal,
          timeout: 5000,
          headers: {
            'X-Api-Key': useRuntimeConfig().public.apiKey || 'api'
          }
        })
        clearTimeout(timeoutId)
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId)
        throw fetchError
      }
      
      health.value.isHealthy = true
      health.value.lastError = null
      health.value.retryAttempts = 0
      health.value.lastChecked = new Date()
    } catch (error: unknown) {
      health.value.isHealthy = false
      health.value.lastError = getErrorMessage(error)
      health.value.lastChecked = new Date()
      
      if (!silent) {
        console.error('API Health Check Failed:', error)
      }
    } finally {
      health.value.isChecking = false
    }
  }

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'FetchError') {
      const fetchError = error as { code?: string; message?: string }
      if (fetchError.code === 'ECONNREFUSED' || (fetchError.message && fetchError.message.includes('ECONNREFUSED'))) {
        return 'Cannot connect to server - Connection refused'
      }
      if (fetchError.code === 'ENOTFOUND' || (fetchError.message && fetchError.message.includes('ENOTFOUND'))) {
        return 'Cannot connect to server - Server not found'
      }
      if (fetchError.code === 'ETIMEDOUT' || (fetchError.message && fetchError.message.includes('timeout'))) {
        return 'Connection timeout - Server is not responding'
      }
      return 'Network connection failed'
    }
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const httpError = error as { statusCode?: number }
      if (httpError.statusCode === 500) {
        return 'Server internal error'
      }
      if (httpError.statusCode === 503) {
        return 'Service temporarily unavailable'
      }
    }
    
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? (error as { message?: string }).message 
      : 'API communication error'
    return errorMessage || 'API communication error'
  }

  const startHealthChecking = () => {
    if (healthCheckInterval) return
    
    // Initial check
    checkApiHealth(true)
    
    // Set up periodic checks
    healthCheckInterval = setInterval(() => {
      checkApiHealth(true)
    }, HEALTH_CHECK_INTERVAL)
  }

  const stopHealthChecking = () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval)
      healthCheckInterval = null
    }
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      retryTimeout = null
    }
  }

  const retryConnection = async () => {
    if (health.value.retryAttempts >= MAX_RETRY_ATTEMPTS) {
      return false
    }
    
    health.value.retryAttempts++
    
    return new Promise((resolve) => {
      retryTimeout = setTimeout(async () => {
        await checkApiHealth()
        resolve(health.value.isHealthy)
      }, RETRY_DELAY)
    })
  }

  const reset = () => {
    health.value = {
      isHealthy: true,
      isChecking: false,
      lastError: null,
      lastChecked: null,
      retryAttempts: 0
    }
  }

  // Auto-start health checking (only in component context)
  if (import.meta.client && getCurrentInstance()) {
    onMounted(() => {
      startHealthChecking()
    })

    // Cleanup on unmount
    onUnmounted(() => {
      stopHealthChecking()
    })
  }

  return {
    health: readonly(health),
    checkApiHealth,
    retryConnection,
    reset,
    startHealthChecking,
    stopHealthChecking
  }
}
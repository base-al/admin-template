
export const useApi = () => {
  const config = useRuntimeConfig()
  // Use proxy in development, direct API in production
  const baseURL = import.meta.dev 
    ? '/api'  // Use proxy
    : config.public.apiBase || 'http://localhost:8200/api'
  const apiKey = config.public.apiKey || 'api'
  
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
    secure: true,
    sameSite: 'strict'
  })
  
  const setToken = (newToken: string) => {
    token.value = newToken
  }

  const removeToken = () => {
    token.value = null
  }

  const getHeaders = (includeAuth = true): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    }

    if (includeAuth && token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    return headers
  }

  const getAuthOnlyHeaders = (): HeadersInit => {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    }
  }

  const apiRequest = async <T = unknown>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      body?: unknown
      headers?: Record<string, string>
      requireAuth?: boolean
      skipErrorHandling?: boolean
    } = {}
  ): Promise<T> => {
    const requireAuth = options.requireAuth ?? true
    try {
      const response = await $fetch<T>(`${baseURL}${endpoint}`, {
        method: options.method || 'GET',
        body: options.body,
        timeout: 10000, // 10 second timeout
        headers: {
          ...getHeaders(requireAuth),
          ...options.headers,
        },
      })
      return response
    } catch (error: unknown) {
      // Check for token expiration first
      if (!options.skipErrorHandling && isTokenExpiredError(error)) {
        await handleTokenExpired()
        throw new Error('Session expired. Please login again.')
      }
      
      // Check if this is a connection error and handle it globally
      if (!options.skipErrorHandling && isConnectionError(error)) {
        // Trigger global error handler
        if (import.meta.client) {
          const { $handleApiError } = useNuxtApp()
          if ($handleApiError) {
            $handleApiError(error)
          }
        }
      }
      
      const errorMessage = error && typeof error === 'object' && 'data' in error 
        ? (error.data as { message?: string })?.message
        : error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message
        : 'API request failed'
      throw new Error(errorMessage)
    }
  }

  const isConnectionError = (error: unknown): boolean => {
    if (!error) return false
    
    // Network/connection errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'FetchError') return true
    
    // Server errors that indicate API problems
    if (error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 500) return true
    
    // Connection refused, timeout, etc.
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ENETUNREACH'].includes(error.code)) {
      return true
    }
    
    // Error message contains connection-related keywords
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && /connection|network|timeout|refused|unavailable|fetch/i.test(error.message)) {
      return true
    }
    
    return false
  }

  const isTokenExpiredError = (error: unknown): boolean => {
    if (!error) return false
    
    // Check for 401 status with token expired message
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
      const errorMessage = error && typeof error === 'object' && 'data' in error 
        ? (error.data as { error?: string })?.error
        : error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message
        : ''
      
      return typeof errorMessage === 'string' && /token.*expired|expired.*token|invalid.*claims/i.test(errorMessage)
    }
    
    return false
  }

  const handleTokenExpired = async () => {
    if (import.meta.client) {
      // Clear auth state and redirect to login
      const authStore = useAuthStore()
      await authStore.logout()
    }
  }

  const authRequest = async <T = unknown>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      body?: unknown
      headers?: Record<string, string>
      skipErrorHandling?: boolean
    } = {}
  ): Promise<T> => {
    try {
      const response = await $fetch<T>(`${baseURL}${endpoint}`, {
        method: options.method || 'GET',
        body: options.body,
        timeout: 10000, // 10 second timeout
        headers: {
          ...getAuthOnlyHeaders(),
          ...options.headers,
        },
      })
      return response
    } catch (error: unknown) {
      // Check for token expiration first
      if (!options.skipErrorHandling && isTokenExpiredError(error)) {
        await handleTokenExpired()
        throw new Error('Session expired. Please login again.')
      }
      
      // Check if this is a connection error and handle it globally
      if (!options.skipErrorHandling && isConnectionError(error)) {
        // Trigger global error handler
        if (import.meta.client) {
          const { $handleApiError } = useNuxtApp()
          if ($handleApiError) {
            $handleApiError(error)
          }
        }
      }
      
      const errorMessage = error && typeof error === 'object' && 'data' in error 
        ? (error.data as { message?: string })?.message
        : error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message
        : 'API request failed'
      throw new Error(errorMessage)
    }
  }

  return {
    // Core functions
    token: readonly(token),
    setToken,
    removeToken,
    
    // HTTP Methods
    get: <T = unknown>(endpoint: string) => apiRequest<T>(endpoint),
    post: <T = unknown>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, { method: 'POST', body: data }),
    put: <T = unknown>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, { method: 'PUT', body: data }),
    patch: <T = unknown>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, { method: 'PATCH', body: data }),
    delete: <T = unknown>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
    
    // Auth-only requests (no Bearer token)
    authPost: <T = unknown>(endpoint: string, data?: unknown) => authRequest<T>(endpoint, { method: 'POST', body: data }),
    authGet: <T = unknown>(endpoint: string) => authRequest<T>(endpoint),
    
    // Direct access to request methods (for advanced usage)
    authRequest: authRequest,
    request: apiRequest,
  }
}
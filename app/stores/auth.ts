import { defineStore } from 'pinia'
import type { AuthUserData, AuthResponse, LoginRequest, RegisterRequest } from '~/types'

interface AuthState {
  user: AuthUserData | null
  token: string | null
  roleId: number | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    roleId: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }),

  getters: {
    currentUser: (state) => state.user,
    hasRole: (state) => (role: string) => state.user?.role === role,
    isAdmin: (state) => state.user?.role === 'admin',
    isFinancial: (state) => state.user?.role === 'financial',
    isTechnical: (state) => state.user?.role === 'technical',
    isSupport: (state) => state.user?.role === 'support',
    isSales: (state) => state.user?.role === 'sales',
    isManager: (state) => state.user?.role === 'manager',
    canManage: (state) => ['admin', 'manager'].includes(state.user?.role || ''),
    canAccessFinancials: (state) => ['admin', 'financial', 'manager'].includes(state.user?.role || ''),
    canAccessTechnical: (state) => ['admin', 'technical', 'manager'].includes(state.user?.role || ''),
    userName: (state) => state.user?.name || 'User',
    userEmail: (state) => state.user?.email || '',
    userAvatar: (state) => state.user?.avatar || null
  },

  actions: {
    async login(credentials: LoginRequest) {
      this.isLoading = true
      this.error = null
      
      try {
        const api = useApi()
        const authData = await api.authPost<AuthResponse>('/auth/login', {
          email: credentials.email,
          password: credentials.password
        })
        
        // Set the token
        this.token = authData.accessToken
        api.setToken(authData.accessToken)
        
        // Create user object from auth response
        const userData: AuthUserData = {
          id: authData.id,
          email: authData.email,
          username: authData.username,
          first_name: authData.first_name,
          last_name: authData.last_name,
          name: `${authData.first_name} ${authData.last_name}`.trim(),
          phone: authData.phone,
          role: this.mapRoleNameToRole(authData.extend.role.name),
          avatar: authData.avatar_url,
          last_login: authData.last_login,
          created_at: '', // Not provided by API
          updated_at: '' // Not provided by API
        }
        
        this.user = userData
        this.roleId = authData.extend.role.id
        this.isAuthenticated = true
        
        // Persist to localStorage for hydration
        this.persistAuthState()
        
        // Initialize authorization permissions with a small delay to ensure token is set
        try {
          // Small delay to ensure token cookie is properly set
          await new Promise(resolve => setTimeout(resolve, 100))
          const authorizationStore = useAuthorizationStore()
          await authorizationStore.initialize()
        } catch (error) {
          console.warn('Failed to initialize authorization after login:', error)
        }
        
        // Navigate to dashboard after successful login
        if (typeof window !== 'undefined') {
          await navigateTo('/app/dashboard')
        }
        
        return { success: true, data: userData }
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Login failed'
        this.clearAuthState()
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async register(userData: RegisterRequest) {
      this.isLoading = true
      this.error = null
      
      try {
        const api = useApi()
        const authData = await api.authPost<AuthResponse>('/auth/register', {
          email: userData.email,
          password: userData.password,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          username: userData.username
        })
        
        // Set the token
        this.token = authData.accessToken
        api.setToken(authData.accessToken)
        
        // Create user object from auth response
        const userDataObj: AuthUserData = {
          id: authData.id,
          email: authData.email,
          username: authData.username,
          first_name: authData.first_name,
          last_name: authData.last_name,
          name: `${authData.first_name} ${authData.last_name}`.trim(),
          phone: authData.phone,
          role: this.mapRoleNameToRole(authData.extend.role.name),
          avatar: authData.avatar_url,
          last_login: authData.last_login,
          created_at: '',
          updated_at: ''
        }
        
        this.user = userDataObj
        this.roleId = authData.extend.role.id
        this.isAuthenticated = true
        
        // Persist to localStorage for hydration
        this.persistAuthState()
        
        // Initialize authorization permissions
        try {
          const authorizationStore = useAuthorizationStore()
          await authorizationStore.initialize()
        } catch (error) {
          console.warn('Failed to initialize authorization after registration:', error)
        }
        
        // Navigate to dashboard after successful registration
        if (typeof window !== 'undefined') {
          await navigateTo('/app/dashboard')
        }
        
        return { success: true, data: userDataObj }
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Registration failed'
        this.clearAuthState()
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      this.isLoading = true
      
      try {
        const api = useApi()
        await api.post('/auth/logout')
      } catch (error) {
        // Even if API call fails, clear local auth state
        console.warn('Logout API call failed:', error)
      } finally {
        const api = useApi()
        api.removeToken()
        
        // Clear authorization cache
        try {
          const authorizationStore = useAuthorizationStore()
          authorizationStore.clearPermissionCache()
        } catch (error) {
          console.warn('Failed to clear authorization cache during logout:', error)
        }
        
        this.clearAuthState()
        this.clearPersistedState()
        this.isLoading = false
        
        // Navigate to login page after logout
        if (typeof window !== 'undefined') {
          await navigateTo('/')
        }
      }
    },

    async forgotPassword(email: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const api = useApi()
        await api.authPost('/auth/forgot-password', { email })
        return { success: true }
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to send reset email'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async resetPassword(resetToken: string, password: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const api = useApi()
        await api.authPost('/auth/reset-password', { token: resetToken, password })
        return { success: true }
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Password reset failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async checkAuth() {
      if (!this.token) {
        this.hydrateAuthState()
      }
      
      if (!this.token) {
        return false
      }
      
      try {
        // Skip profile check for now since endpoint doesn't exist
        // Just verify we have token and user data
        if (this.user && this.token) {
          const api = useApi()
          api.setToken(this.token)
          this.isAuthenticated = true
          return true
        }
        
        this.clearAuthState()
        this.clearPersistedState()
        return false
      } catch (error: unknown) {
        console.error('Auth check failed:', error)
        this.clearAuthState()
        this.clearPersistedState()
        return false
      }
    },

    // Helper methods
    mapRoleNameToRole(roleName: string): AuthUserData['role'] {
      const roleMap: Record<string, AuthUserData['role']> = {
        'Owner': 'admin',
        'Admin': 'admin',
        'Administrator': 'admin',
        'Financial': 'financial',
        'Finance': 'financial',
        'Technical': 'technical',
        'Technician': 'technical',
        'Support': 'support',
        'Customer Support': 'support',
        'Sales': 'sales',
        'Sales Rep': 'sales',
        'Manager': 'manager',
        'Department Manager': 'manager'
      }
      return roleMap[roleName] || 'support'
    },

    clearAuthState() {
      this.user = null
      this.token = null
      this.roleId = null
      this.isAuthenticated = false
      this.error = null
    },

    persistAuthState() {
      if (typeof window !== 'undefined') {
        const authState = {
          user: this.user,
          token: this.token,
          roleId: this.roleId,
          isAuthenticated: this.isAuthenticated
        }
        localStorage.setItem('base_auth', JSON.stringify(authState))
      }
    },

    hydrateAuthState() {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('base_auth')
          if (stored) {
            const authState = JSON.parse(stored)
            this.user = authState.user
            this.token = authState.token
            this.roleId = authState.roleId
            this.isAuthenticated = authState.isAuthenticated
            
            // Set token in API client
            if (this.token) {
              const api = useApi()
              api.setToken(this.token)
            }
          }
        } catch (error) {
          console.warn('Failed to hydrate auth state:', error)
          this.clearPersistedState()
        }
      }
    },

    clearPersistedState() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('base_auth')
      }
    },

    // Initialize store
    async initialize() {
      this.hydrateAuthState()
      if (this.token && this.user) {
        // Verify token is still valid
        await this.checkAuth()
        
        // Initialize authorization permissions after auth is confirmed
        if (this.isAuthenticated) {
          try {
            const authorizationStore = useAuthorizationStore()
            await authorizationStore.initialize()
          } catch (error) {
            console.warn('Failed to initialize authorization store:', error)
          }
        }
      }
    }
  }
})
import { defineStore } from 'pinia'
import type { 
  Role, 
  Permission, 
  PermissionCheck
} from '~/types'

interface StoreAuthorizationState {
  roles: Role[]
  permissions: Permission[]
  userPermissions: Map<string, boolean> // Cache for user permission checks
  userPermissionList: string[] // List of user permissions in "resource:action" format
  isLoadingRoles: boolean
  isLoadingPermissions: boolean
  isLoadingUserPermissions: boolean
  error: string | null
}

export const useAuthorizationStore = defineStore('authorization', {
  state: (): StoreAuthorizationState => ({
    roles: [],
    permissions: [],
    userPermissions: new Map(),
    userPermissionList: [],
    isLoadingRoles: false,
    isLoadingPermissions: false,
    isLoadingUserPermissions: false,
    error: null
  }),

  getters: {
    roleOptions: (state) => state.roles.map(role => ({
      label: role.name,
      value: role.id,
      description: role.description
    })),

    getRoleById: (state) => (id: number) => state.roles.find(role => role.id === id),

    getPermissionsByResource: (state) => (resourceType: string) => 
      state.permissions.filter(permission => permission.resource_type === resourceType),

    // Check if permission is cached
    isCached: (state) => (key: string) => state.userPermissions.has(key),

    // Efficient permission check using the fetched permissions list
    hasPermission: (state) => (resource: string, action: string) => {
      const permissionKey = `${resource}:${action}`
      return state.userPermissionList.includes(permissionKey)
    }
  },

  actions: {
    async fetchRoles() {
      if (this.isLoadingRoles) return

      this.isLoadingRoles = true
      this.error = null

      try {
        const api = useApi()
        const { data } = await api.get<{ data: Role[] }>('/authorization/roles')
        this.roles = data
      } catch (error: unknown) {
        this.error = error.message || 'Failed to fetch roles'
        console.error('Error fetching roles:', error)
      } finally {
        this.isLoadingRoles = false
      }
    },

    async fetchPermissions() {
      if (this.isLoadingPermissions) return

      this.isLoadingPermissions = true
      this.error = null

      try {
        const api = useApi()
        const { data } = await api.get<{ data: Permission[] }>('/authorization/permissions')
        this.permissions = data
      } catch (error: unknown) {
        this.error = error.message || 'Failed to fetch permissions'
        console.error('Error fetching permissions:', error)
      } finally {
        this.isLoadingPermissions = false
      }
    },

    async fetchRolePermissions(roleId: number) {
      try {
        const api = useApi()
        const { data } = await api.get<{ data: Permission[] }>(`/authorization/roles/${roleId}/permissions`)
        return data
      } catch (error: unknown) {
        console.error('Error fetching role permissions:', error)
        return []
      }
    },

    /**
     * Fetch all permissions for the current user
     * This replaces individual permission checks for better performance
     */
    async fetchUserPermissions() {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated || !authStore.user) {
        this.userPermissionList = []
        return
      }

      if (this.isLoadingUserPermissions) return

      this.isLoadingUserPermissions = true
      this.error = null

      try {
        const api = useApi()
        
        // Retry mechanism for auth token availability
        let attempts = 0
        let response
        while (attempts < 3) {
          try {
            response = await api.get<{ data: Permission[] }>('/authorization/user/permissions')
            break
          } catch (error: any) {
            if (error.statusCode === 401 && attempts < 2) {
              attempts++
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 200))
              continue
            }
            throw error
          }
        }
        
        // Handle API response - backend returns array of Permission objects in data field
        const permissionObjects = response.data || []
        
        // Convert Permission objects to "resource:action" format
        const permissions = permissionObjects.map(p => `${p.resource_type || p.resource}:${p.action}`)
        this.userPermissionList = permissions
        
        // Also populate the cache for backward compatibility
        const userId = authStore.user.id
        permissions.forEach(permission => {
          const [resource, action] = permission.split(':')
          const cacheKey = `${userId}-${resource}-${action}`
          this.userPermissions.set(cacheKey, true)
        })
        
      } catch (error: unknown) {
        // If we get a 401, user is not authenticated - clear permissions
        if (error.statusCode === 401 || error.status === 401) {
          this.userPermissionList = []
          this.userPermissions.clear()
          console.log('User not authenticated, clearing permissions')
          return
        }
        
        this.error = error.message || 'Failed to fetch user permissions'
        console.error('Error fetching user permissions:', error)
        this.userPermissionList = []
      } finally {
        this.isLoadingUserPermissions = false
      }
    },

    /**
     * Check if the current user has permission to perform an action on a resource
     * @param resourceType - The type of resource (e.g., 'customers', 'orders', 'employees')
     * @param action - The action to perform (e.g., 'create', 'read', 'update', 'delete')
     * @param resourceId - Optional specific resource ID
     * @returns Promise<boolean>
     */
    async checkPermission(
      resourceType: string,
      action: string,
      resourceId?: string
    ): Promise<boolean> {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated || !authStore.user) {
        return false
      }

      // Create cache key
      const cacheKey = `${authStore.user.id}-${resourceType}-${action}${resourceId ? `-${resourceId}` : ''}`
      
      // Return cached result if available
      if (this.userPermissions.has(cacheKey)) {
        return this.userPermissions.get(cacheKey)!
      }

      try {
        const requestBody: Record<string, string | number> = {
          user_id: authStore.user.id,
          resource_type: resourceType,
          action: action
        }

        // Include role_id only if it exists
        if (authStore.roleId !== null) {
          requestBody.role_id = authStore.roleId
        }

        if (resourceId) {
          requestBody.resource_id = resourceId
        }

        const api = useApi()
        const response = await api.post<PermissionCheck>('/authorization/check', requestBody)

        // Cache the result
        this.userPermissions.set(cacheKey, response.has_permission)
        
        return response.has_permission
      } catch (error: unknown) {
        console.error('Error checking permission:', error)
        // Cache negative result to avoid repeated API calls
        this.userPermissions.set(cacheKey, false)
        return false
      }
    },

    /**
     * Clear permission cache for a user (useful when user roles change)
     */
    clearPermissionCache(userId?: number) {
      if (userId) {
        // Clear cache for specific user
        const keysToDelete = Array.from(this.userPermissions.keys())
          .filter(key => key.startsWith(`${userId}-`))
        
        keysToDelete.forEach(key => this.userPermissions.delete(key))
      } else {
        // Clear all cached permissions
        this.userPermissions.clear()
      }
    },

    /**
     * Preload common permissions for better UX
     */
    async preloadUserPermissions() {
      const authStore = useAuthStore()
      
      if (!authStore.isAuthenticated || !authStore.user) {
        return
      }

      // Common resource types and actions to preload
      const commonChecks = [
        // Customer management
        { resourceType: 'customers', action: 'create' },
        { resourceType: 'customers', action: 'read' },
        { resourceType: 'customers', action: 'update' },
        { resourceType: 'customers', action: 'delete' },
        
        // Business customer management
        { resourceType: 'business_customers', action: 'create' },
        { resourceType: 'business_customers', action: 'read' },
        { resourceType: 'business_customers', action: 'update' },
        { resourceType: 'business_customers', action: 'delete' },
        
        // Order management
        { resourceType: 'orders', action: 'create' },
        { resourceType: 'orders', action: 'read' },
        { resourceType: 'orders', action: 'update' },
        { resourceType: 'orders', action: 'delete' },
        
        // Employee management
        { resourceType: 'employees', action: 'create' },
        { resourceType: 'employees', action: 'read' },
        { resourceType: 'employees', action: 'update' },
        { resourceType: 'employees', action: 'delete' },
        
        // Settings management
        { resourceType: 'settings', action: 'read' },
        { resourceType: 'settings', action: 'update' },
        
        // Role management
        { resourceType: 'authorization', action: 'manage_role' },
      ]

      // Preload permissions in batches to avoid overwhelming the API
      const batchSize = 5
      for (let i = 0; i < commonChecks.length; i += batchSize) {
        const batch = commonChecks.slice(i, i + batchSize)
        await Promise.all(
          batch.map(({ resourceType, action }) =>
            this.checkPermission(resourceType, action).catch(() => false)
          )
        )
      }
    },

    /**
     * Initialize the authorization store
     */
    async initialize() {
      await Promise.all([
        this.fetchRoles(),
        this.fetchUserPermissions() // Use new efficient method
      ])
    }
  }
})
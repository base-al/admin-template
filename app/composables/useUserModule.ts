/**
 * Employee Module Composable
 * 
 * Standalone, reusable employee management system with roles and permissions.
 * This composable provides a complete interface for employee CRUD operations,
 * role management, and permission checking.
 * 
 * Features:
 * - Employee CRUD operations
 * - Role and permission management
 * - Reactive state management
 * - Type-safe API calls
 * - Permission-based access control
 */

import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  Role,
  Permission,
  RoleCreateRequest,
  RoleUpdateRequest,
  PermissionCheck
} from '~/types'

export interface UserModuleState {
  employees: User[]
  selectedEmployee: User | null
  roles: Role[]
  permissions: Permission[]
  loading: boolean
  error: string | null
}

export function useUserModule() {
  // ===== STATE =====
  const state = reactive<EmployeeModuleState>({
    employees: [],
    selectedEmployee: null,
    roles: [],
    permissions: [],
    loading: false,
    error: null
  })

  // ===== API COMPOSABLES =====
  const api = useApi()
  const toast  = useToast()

  // ===== EMPLOYEE OPERATIONS =====
  
  /**
   * Fetch all employees with optional filters
   */
  const fetchEmployees = async (filters: Record<string, unknown> = {}) => {
    state.loading = true
    state.error = null
    
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await api.get<UserResponse>(`/employees?${params}`)
      state.employees = response.data || []
      return response
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : ''
      state.error = errorMessage || 'Failed to fetch employees'
      toast.add({
        title: 'Error',
        description: state.error,
       
      })
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * Fetch a single employee by ID
   */
  const fetchEmployee = async (id: number) => {
    state.loading = true
    state.error = null
    
    try {
      const employee = await api.get<User>(`/employees/${id}`)
      state.selectedEmployee = employee
      return employee
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : ''
      state.error = errorMessage || 'Failed to fetch employee'
      toast.add({
        title: 'Error',
        description: state.error,
       
      })
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * Create a new employee
   */
  const createEmployee = async (employeeData: CreateUserRequest) => {
    state.loading = true
    state.error = null
    
    try {
      const newEmployee = await api.post<User>('/employees', employeeData)
      state.employees.unshift(newEmployee)
      
      toast.add({
        title: 'Success',
        description: 'Employee created successfully',
        
      })
      
      return newEmployee
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : ''
      state.error = errorMessage || 'Failed to create employee'
      toast.add({
        title: 'Error',
        description: state.error,
       
      })
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * Update an existing employee
   */
  const updateEmployee = async (id: number, employeeData: UpdateUserRequest) => {
    state.loading = true
    state.error = null
    
    try {
      const updatedEmployee = await api.put<User>(`/employees/${id}`, employeeData)
      
      const index = state.employees.findIndex(emp => emp.id === id)
      if (index !== -1) {
        state.employees[index] = updatedEmployee
      }
      
      if (state.selectedEmployee?.id === id) {
        state.selectedEmployee = updatedEmployee
      }
      
      toast.add({
        title: 'Success',
        description: 'Employee updated successfully',
        
      })
      
      return updatedEmployee
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : ''
      state.error = errorMessage || 'Failed to update employee'
      toast.add({
        title: 'Error',
        description: state.error,
       
      })
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * Delete an employee
   */
  const deleteEmployee = async (id: number) => {
    state.loading = true
    state.error = null
    
    try {
      await api.delete(`/employees/${id}`)
      
      state.employees = state.employees.filter(emp => emp.id !== id)
      if (state.selectedEmployee?.id === id) {
        state.selectedEmployee = null
      }
      
      toast.add({
        title: 'Success',
        description: 'Employee deleted successfully',
        
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : ''
      state.error = errorMessage || 'Failed to delete employee'
      toast.add({
        title: 'Error',
        description: state.error,
       
      })
      throw error
    } finally {
      state.loading = false
    }
  }

  // ===== ROLE OPERATIONS =====
  
  /**
   * Fetch all roles
   */
  const fetchRoles = async () => {
    state.loading = true
    state.error = null
    
    try {
      const response = await api.get<Role[] | { data: Role[] }>('/authorization/roles')
      state.roles = Array.isArray(response) ? response : response.data || []
      return state.roles
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : ''
      state.error = errorMessage || 'Failed to fetch roles'
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * Create a new role
   */
  const createRole = async (roleData: RoleCreateRequest) => {
    state.loading = true
    state.error = null
    
    try {
      const newRole = await api.post<Role>('/authorization/roles', roleData)
      // Ensure the role is properly typed
      const typedRole = newRole as Role
      state.roles.unshift(typedRole)
      
      toast.add({
        title: 'Success',
        description: 'Role created successfully',
        
      })
      
      return typedRole
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create role'
      state.error = errorMessage
      toast.add({
        title: 'Error',
        description: state.error,
       
      })
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * Update an existing role
   */
  const updateRole = async (id: number, roleData: RoleUpdateRequest) => {
    state.loading = true
    state.error = null
    
    try {
      const updatedRole = await api.put<Role>(`/authorization/roles/${id}`, roleData)
      
      const index = state.roles.findIndex(role => role.id === id)
      if (index !== -1) {
        state.roles[index] = updatedRole
      }
      
      toast.add({
        title: 'Success',
        description: 'Role updated successfully',
        
      })
      
      return updatedRole
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : ''
      state.error = errorMessage || 'Failed to update role'
      toast.add({
        title: 'Error',
        description: state.error,
       
      })
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * Delete a role
   */
  const deleteRole = async (id: number) => {
    state.loading = true
    state.error = null
    
    try {
      await api.delete(`/authorization/roles/${id}`)
      
      state.roles = state.roles.filter(role => role.id !== id)
      
      toast.add({
        title: 'Success',
        description: 'Role deleted successfully',
        
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : ''
      state.error = errorMessage || 'Failed to delete role'
      toast.add({
        title: 'Error',
        description: state.error,
       
      })
      throw error
    } finally {
      state.loading = false
    }
  }

  // ===== PERMISSION OPERATIONS =====
  
  /**
   * Fetch all permissions
   */
  const fetchPermissions = async () => {
    state.loading = true
    state.error = null
    
    try {
      const response = await api.get<Permission[] | { data: Permission[] }>('/authorization/permissions')
      state.permissions = Array.isArray(response) ? response : response.data || []
      return state.permissions
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : ''
      state.error = errorMessage || 'Failed to fetch permissions'
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * Check if user has specific permission
   */
  const checkPermission = async (resource: string, action: string, resourceId?: string | number): Promise<boolean> => {
    try {
      const response = await api.post<PermissionCheck>('/authorization/check-permission', {
        resource_type: resource,
        action,
        resource_id: resourceId
      })
      
      return response.has_permission || false
    } catch (error) {
      console.error('Permission check failed:', error)
      return false
    }
  }

  // ===== COMPUTED PROPERTIES =====
  
  const employeeOptions = computed(() => {
    return state.employees.map(emp => ({
      id: emp.id,
      name: emp.name || `${emp.first_name} ${emp.last_name}`.trim(),
      label: emp.name || `${emp.first_name} ${emp.last_name}`.trim(),
      value: emp.id
    }))
  })

  const roleOptions = computed(() => {
    return state.roles.map(role => ({
      id: role.id,
      name: role.name,
      label: role.name,
      value: role.id
    }))
  })

  // ===== UTILITY FUNCTIONS =====
  
  const setSelectedEmployee = (employee: User | null) => {
    state.selectedEmployee = employee
  }

  const clearError = () => {
    state.error = null
  }

  const resetState = () => {
    state.employees = []
    state.selectedEmployee = null
    state.roles = []
    state.permissions = []
    state.loading = false
    state.error = null
  }

  // ===== RETURN API =====
  return {
    // State (using computed to maintain reactivity but return proper types)
    employees: computed(() => state.employees),
    selectedEmployee: computed(() => state.selectedEmployee),
    roles: computed(() => state.roles),
    permissions: computed(() => state.permissions),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    
    // Employee operations
    fetchEmployees,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Role operations
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    
    // Permission operations
    fetchPermissions,
    checkPermission,
    
    // Computed properties
    employeeOptions: readonly(employeeOptions),
    roleOptions: readonly(roleOptions),
    
    // Utility functions
    setSelectedEmployee,
    clearError,
    resetState
  }
}
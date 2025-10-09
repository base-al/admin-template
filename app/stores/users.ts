import { defineStore } from 'pinia'
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '~/types'

interface EmployeesState {
  employees: Employee[]
  selectedEmployee: Employee | null
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

export const useUsersStore = defineStore('employees', {
  state: (): EmployeesState => ({
    employees: [],
    selectedEmployee: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 25
    }
  }),

  getters: {
    employeeById: (state) => (id: number) => 
      state.employees.find(employee => employee.id === id),

    employeesByRole: (state) => (roleId: number) => 
      state.employees.filter(employee => employee.role_id === roleId),

    activeEmployees: (state) => 
      state.employees.filter(employee => !employee.deleted_at),

    employeeCount: (state) => state.employees.length,

    // Transform employees for display
    employeesWithDisplayName: (state) => state.employees.map(employee => ({
      ...employee,
      name: `${employee.first_name} ${employee.last_name}`.trim(),
      display_name: `${employee.first_name} ${employee.last_name}`.trim()
    }))
  },

  actions: {
    async fetchEmployees(page = 1, limit = 25, search = '') {
      this.isLoading = true
      this.error = null

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search })
        })

        const api = useApi()
        const response = await api.get<{
          data: Employee[]
          pagination?: {
            current_page: number
            total_pages: number
            total_items: number
            items_per_page: number
          }
        }>(`/employees?${params}`)

        // Handle both paginated and non-paginated responses
        if (Array.isArray(response)) {
          this.employees = response
        } else {
          this.employees = response.data || []
          if (response.pagination) {
            this.pagination = {
              currentPage: response.pagination.current_page,
              totalPages: response.pagination.total_pages,
              totalItems: response.pagination.total_items,
              itemsPerPage: response.pagination.items_per_page
            }
          }
        }

        return this.employees
      } catch (error: unknown) {
        this.error = error.message || 'Failed to fetch employees'
        console.error('Error fetching employees:', error)
        return []
      } finally {
        this.isLoading = false
      }
    },

    async fetchEmployee(id: number) {
      this.isLoading = true
      this.error = null

      try {
        const api = useApi()
        const employee = await api.get<Employee>(`/employees/${id}`)
        this.selectedEmployee = employee
        
        // Update employee in the list if it exists
        const index = this.employees.findIndex(emp => emp.id === id)
        if (index !== -1) {
          this.employees[index] = employee
        }

        return employee
      } catch (error: unknown) {
        this.error = error.message || 'Failed to fetch employee'
        console.error('Error fetching employee:', error)
        return null
      } finally {
        this.isLoading = false
      }
    },

    async createEmployee(employeeData: CreateEmployeeRequest) {
      this.isCreating = true
      this.error = null

      try {
        const api = useApi()
        const newEmployee = await api.post<Employee>('/employees', employeeData)

        // Add to local state
        this.employees.unshift(newEmployee)
        this.pagination.totalItems++

        return { success: true, data: newEmployee }
      } catch (error: unknown) {
        this.error = error.message || 'Failed to create employee'
        console.error('Error creating employee:', error)
        return { success: false, error: this.error }
      } finally {
        this.isCreating = false
      }
    },

    async updateEmployee(id: number, employeeData: UpdateEmployeeRequest) {
      this.isUpdating = true
      this.error = null

      try {
        const api = useApi()
        const updatedEmployee = await api.put<Employee>(`/employees/${id}`, employeeData)

        // Update in local state
        const index = this.employees.findIndex(emp => emp.id === id)
        if (index !== -1) {
          this.employees[index] = updatedEmployee
        }

        if (this.selectedEmployee?.id === id) {
          this.selectedEmployee = updatedEmployee
        }

        return { success: true, data: updatedEmployee }
      } catch (error: unknown) {
        this.error = error.message || 'Failed to update employee'
        console.error('Error updating employee:', error)
        return { success: false, error: this.error }
      } finally {
        this.isUpdating = false
      }
    },

    async deleteEmployee(id: number) {
      this.isDeleting = true
      this.error = null

      try {
        const api = useApi()
        await api.delete(`/employees/${id}`)

        // Remove from local state
        this.employees = this.employees.filter(emp => emp.id !== id)
        this.pagination.totalItems--

        if (this.selectedEmployee?.id === id) {
          this.selectedEmployee = null
        }

        return { success: true }
      } catch (error: unknown) {
        this.error = error.message || 'Failed to delete employee'
        console.error('Error deleting employee:', error)
        return { success: false, error: this.error }
      } finally {
        this.isDeleting = false
      }
    },

    async changeEmployeePassword(id: number, newPassword: string, currentPassword: string) {
      this.isUpdating = true
      this.error = null

      try {
        const api = useApi()
        const result = await api.put(`/employees/${id}/password`, {
          NewPassword: newPassword,
          CurrentPassword: currentPassword
        })

        return { success: true, data: result }
      } catch (error: unknown) {
        this.error = error.message || 'Failed to change employee password'
        console.error('Error changing employee password:', error)
        return { success: false, error: this.error }
      } finally {
        this.isUpdating = false
      }
    },

    async searchEmployees(query: string) {
      return await this.fetchEmployees(1, this.pagination.itemsPerPage, query)
    },

    setSelectedEmployee(employee: Employee | null) {
      this.selectedEmployee = employee
    },

    clearError() {
      this.error = null
    },

    clearEmployees() {
      this.employees = []
      this.selectedEmployee = null
      this.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 25
      }
    },

    // Refresh current page
    async refresh() {
      await this.fetchEmployees(this.pagination.currentPage, this.pagination.itemsPerPage)
    }
  }
})
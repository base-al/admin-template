// ===== EMPLOYEE MANAGEMENT TYPES =====
// Internal team member management and operations
// Authorization types moved to authorization.ts for better organization
import type { Role } from './authorization'

export interface Employee {
  id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  first_name: string
  last_name: string
  username: string
  phone: string
  email: string
  role_id: number
  role?: Role
  name?: string // Computed field for display (first_name + last_name)
  avatar_url?: string
  last_login?: string
}

export interface CreateEmployeeRequest {
  first_name: string
  last_name: string
  username: string
  phone?: string
  email: string
  role_id: number
  password: string
}

export interface UpdateEmployeeRequest {
  first_name?: string
  last_name?: string
  username?: string
  phone?: string
  email?: string
  role_id?: number
  password?: string
}

export interface EmployeeSelectOption {
  id: number
  name: string
}

export interface EmployeeListResponse {
  id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  first_name: string
  last_name: string
  username: string
  phone: string
  email: string
  role_id: number
  role?: Role
}

// Table row types for type-safe table components
export interface EmployeeTableRow extends Employee {
  display_name?: string
  full_name?: string
}

// API Response types
export interface EmployeeResponse {
  data: Employee[]
  pagination?: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

export interface SingleEmployeeResponse {
  data: Employee
}




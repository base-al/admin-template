// ===== AUTHORIZATION TYPES =====
// Role-based access control, permissions, and authorization state
// Used by employee management system and access control

export interface Permission {
  id: number
  name: string
  resource: string
  resource_type?: string
  action: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface Role {
  id: number
  name: string
  description?: string
  is_system?: boolean
  permission_count?: number
  permissions?: Permission[]
  created_at: string
  updated_at: string
}

// Role CRUD operations
export interface RoleCreateRequest {
  name: string
  description?: string
}

export interface RoleUpdateRequest {
  name?: string
  description?: string
}

export interface RolePermissionRequest {
  role_id: number
  permission_ids: number[]
}

// Permission checking
export interface PermissionCheck {
  has_permission: boolean
  reason?: string
}

export interface PermissionCheckRequest {
  resource_type: string
  action: string
  resource_id?: string | number
}

// Authorization state management
export interface AuthorizationState {
  permissions: Record<string, boolean>
  lastCheck: Record<string, number>
  cacheExpiry: number
}

// Table row types for type-safe table components
export interface RoleTableRow extends Role {
  display_name?: string
}

export interface PermissionTableRow extends Permission {
  display_resource?: string
}

// API Response types
export interface RoleResponse {
  data: Role[]
  meta?: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface SingleRoleResponse {
  data: Role
}

export interface PermissionResponse {
  data: Permission[]
  meta?: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface RolePermissionResponse {
  data: Permission[]
}
// ===== AUTHENTICATION TYPES =====
// User authentication, login/logout, and session management
// Excludes role-based authorization (see authorization.ts)

export interface User {
  id: number
  email: string
  username?: string
  first_name?: string
  last_name?: string
  name?: string
  phone?: string
  role: UserRole
  status: UserStatus
  avatar?: string
  last_login?: string
  created_at: string
  updated_at: string
}

export type UserRole = 'admin' | 'financial' | 'technical' | 'support' | 'sales' | 'manager'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface AuthResponse {
  id: number
  first_name: string
  last_name: string
  username: string
  phone?: string
  email: string
  role_id: number
  role_name?: string
  avatar_url?: string
  last_login?: string
  accessToken: string
  exp: number
  extend: {
    role: {
      id: number
      name: string
    }
    user_id: number
  }
}

export interface AuthUserData {
  id: number
  email: string
  username?: string
  first_name?: string
  last_name?: string
  name: string // computed from first_name + last_name
  phone?: string
  role: UserRole
  avatar?: string
  last_login?: string
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
  username?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}


export interface UserCreateRequest {
  email: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
  username?: string
  role: UserRole
}

export interface UserUpdateRequest extends Partial<Omit<UserCreateRequest, 'password'>> {
  status?: UserStatus
}


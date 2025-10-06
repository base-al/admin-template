// ===== API & CONNECTIVITY TYPES =====
// HTTP API responses, error handling, and customer connectivity status
// Note: ConnectionStatus here is for customer internet connectivity checks
export interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  plan_id?: number
  radius_username?: string
  radius_password?: string
  status: CustomerStatus
  connection_status?: ConnectionStatus
  last_login?: string
  data_usage?: DataUsage
  billing_address?: BillingAddress
  notes?: string
  created_at: string
  updated_at: string
}

// Customer account status
export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'pending'

// API/Service connectivity status - for customer internet connection checks
export type ConnectionStatus = 'online' | 'offline' | 'limited' | 'blocked'

export interface DataUsage {
  current_month_mb: number
  last_month_mb: number
  total_mb: number
  last_updated: string
}

export interface BillingAddress {
  street: string
  city: string
  postal_code: string
  country: string
}

// ISP Service Plan Types
export interface Plan {
  id: number
  name: string
  description?: string
  price: number
  currency: string
  bandwidth_up: number // in Kbps
  bandwidth_down: number // in Kbps
  data_limit?: number // in MB, null for unlimited
  duration_days?: number
  radius_group?: string
  status: PlanStatus
  plan_type: PlanType
  features?: PlanFeature[]
  priority?: number
  burst_limit_up?: number
  burst_limit_down?: number
  created_at: string
  updated_at: string
}

export type PlanStatus = 'active' | 'inactive' | 'deprecated'
export type PlanType = 'residential' | 'business' | 'premium' | 'trial'

export interface PlanFeature {
  name: string
  description?: string
  enabled: boolean
}

// Customer Plan Subscription Types
export interface CustomerPlan {
  id: number
  customer_id: number
  plan_id: number
  start_date: string
  end_date?: string
  price: number
  currency: string
  status: CustomerPlanStatus
  auto_renew: boolean
  payment_method?: PaymentMethod
  discount_percentage?: number
  promo_code?: string
  installation_date?: string
  cancellation_reason?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  customer?: Customer
  plan?: Plan
}

export type CustomerPlanStatus = 'active' | 'expired' | 'suspended' | 'pending' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'paypal' | 'crypto'

export interface User {
  id: number
  email: string
  name?: string
  role: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  token: string
  expires_at: string
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

export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface Media {
  id: number
  filename: string
  original_filename: string
  mime_type: string
  size: number
  path: string
  url: string
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  description?: string
  permissions: Permission[]
  created_at: string
  updated_at: string
}

export interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description?: string
}

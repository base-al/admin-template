// Common API & Utility Types

export interface ApiResponse<T> {
  data: T
  message?: string
  status: string
}

// Pagination Response (matches API format exactly)
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    page_size: number
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
  alt_text?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface MediaUploadRequest {
  file: File
  description?: string
  alt_text?: string
}

// Dashboard Statistics Types
export interface DashboardStats {
  total_customers: number
  active_customers: number
  suspended_customers: number
  inactive_customers: number
  total_plans: number
  active_plans: number
  monthly_revenue: number
  active_connections: number
  data_usage_gb: number
  new_customers_this_month: number
}

// Network Status Types
export interface NetworkStatus {
  server_status: 'online' | 'offline' | 'maintenance'
  radius_status: 'online' | 'offline' | 'error'
  database_status: 'online' | 'offline' | 'slow'
  total_bandwidth_usage: number
  peak_bandwidth_usage: number
  active_sessions: number
  last_updated: string
}

// Error Handling Types
export interface ApiError {
  message: string
  code?: string
  field?: string
  details?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// Search & Filter Types
export interface SearchOptions {
  query?: string
  filters?: Record<string, any>
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

// Form Validation Types
export type FormValidationRule = {
  required?: boolean
  min_length?: number
  max_length?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface FormValidationSchema {
  [key: string]: FormValidationRule
}

// Date Range Types
export interface DateRange {
  start_date: string
  end_date: string
}

// Export Types
export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportRequest {
  format: ExportFormat
  filters?: Record<string, any>
  columns?: string[]
  date_range?: DateRange
}

// Password Change Types
export interface PasswordChangeRequest {
  NewPassword: string
  OldPassword: string
}

export interface PasswordChangeResponse {
  success: boolean
  message?: string
  error?: string
}


export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface Stat {
  title: string
  icon: string
  value?: string | number
  variation?: number
  minValue?: number
  maxValue?: number
  minVariation?: number
  maxVariation?: number
}


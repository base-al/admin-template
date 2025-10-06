// Product Types

export interface Product {
  // Primary Key
  id: number

  // Name field
  name: string

  // Price field
  price: number

  // Stock field
  stock: number

  // Timestamps
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

// Create/Update Input Types
export interface CreateProductInput {
  name: string
  price: number
  stock: number
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

// Filter Input Type
export interface ProductFilterInput {
  search?: string
  name?: string
  price?: number
  stock?: number
}

// Sort Input Type
export interface ProductSortInput {
  field: 'created_at' | 'updated_at' | 'name' | 'price' | 'stock'
  order: 'asc' | 'desc'
}

// Tag Types

export interface Tag {
  // Primary Key
  id: number

  // Name field
  name: string

  // Slug field
  slug: string

  // Description field
  description: string

  // Timestamps
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

// Create/Update Input Types
export interface CreateTagInput {
  name: string
  slug: string
  description: string
}

export interface UpdateTagInput extends Partial<CreateTagInput> {}

// Filter Input Type
export interface TagFilterInput {
  search?: string
  name?: string
  slug?: string
  description?: string
}

// Sort Input Type
export interface TagSortInput {
  field: 'created_at' | 'updated_at' | 'name' | 'slug' | 'description'
  order: 'asc' | 'desc'
}

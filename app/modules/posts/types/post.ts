// Post Types - Template with ALL possible field types

export interface Post {
  // Primary Key
  id: number

  // String fields
  title: string
  slug: string

  // Text fields (long content)
  content: string
  excerpt: string

  // Integer fields
  view_count: number
  like_count: number
  comment_count: number

  // Float field
  rating: number

  // Boolean fields
  published: boolean
  featured: boolean
  is_pinned: boolean

  // Enum/Select field (string with fixed values)
  status: PostStatus
  category: PostCategory

  // Relationship (foreign key)
  author_id: number
  author?: User // Optional populated relation

  // DateTime fields
  published_at: string | null
  scheduled_at: string | null

  // JSON fields
  tags: string[] // JSON array
  metadata: Record<string, any> // JSON object

  // File/Image fields
  featured_image: string | null // URL or attachment object
  featured_image_url?: string // Computed URL

  // Timestamps (auto-managed)
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

// Enums
export type PostStatus = 'draft' | 'published' | 'archived' | 'scheduled'
export type PostCategory = 'news' | 'tutorial' | 'announcement' | 'blog'

// Related types
export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
}

// Request/Response types
export interface PostListResponse {
  data: Post[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface PostCreateRequest {
  title: string
  slug?: string
  content: string
  excerpt?: string
  status: PostStatus
  category: PostCategory
  published: boolean
  featured: boolean
  is_pinned: boolean
  published_at?: string
  scheduled_at?: string | null
  tags: string[]
  metadata?: Record<string, any>
}

export interface PostUpdateRequest extends Partial<PostCreateRequest> {}

export interface PostFilters {
  search?: string
  status?: PostStatus
  category?: PostCategory
  author_id?: number
  featured?: boolean
  published?: boolean
  tags?: string[]
  date_from?: string
  date_to?: string
}

export interface PostSortOptions {
  field: 'created_at' | 'published_at' | 'title' | 'view_count' | 'like_count' | 'rating'
  order: 'asc' | 'desc'
}

// Table/List item (simplified for display)
export interface PostListItem {
  id: number
  title: string
  status: PostStatus
  category: PostCategory
  author_id: number
  author_name?: string
  published: boolean
  featured: boolean
  view_count: number
  like_count: number
  rating: number
  published_at: string
  created_at: string
}

// Form data (what the form collects)
export interface PostFormData {
  title: string
  slug: string
  content: string
  excerpt: string
  status: PostStatus
  category: PostCategory
  published: boolean
  featured: boolean
  is_pinned: boolean
  published_at: string | null
  scheduled_at: string | null
  tags: string[]
  metadata: Record<string, any>
  featured_image?: File | string // File for upload or URL
}


export interface PostListResponse {
  data: Post[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface CreatePostInput {
  title: string
  slug?: string
  content: string
  excerpt?: string
  status: PostStatus
  category: PostCategory
  published: boolean
  featured: boolean
  is_pinned: boolean
  published_at?: string | null
  scheduled_at?: string | null
  tags: string[]
  metadata?: Record<string, any>
  featured_image?: File | string | null
}

export interface UpdatePostInput extends Partial<CreatePostInput> {}

export interface PostFilterInput {
  search?: string
  status?: PostStatus
  category?: PostCategory
  published?: boolean
  featured?: boolean
  author_id?: number
}

export interface PostSortInput {
  field: 'created_at' | 'updated_at' | 'published_at' | 'title' | 'view_count' | 'rating'
  order: 'asc' | 'desc'
}
  
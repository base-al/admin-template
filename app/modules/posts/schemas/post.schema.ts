import { z } from 'zod'

// Validation schemas using Zod

// Enums
export const postStatusSchema = z.enum(['draft', 'published', 'archived', 'scheduled'])
export const postCategorySchema = z.enum(['news', 'tutorial', 'announcement', 'blog'])

// Create schema (all validations)
export const createPostSchema = z.object({
  // Required string fields
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),

  // Optional slug (auto-generated from title if not provided)
  slug: z.string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be less than 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),

  // Required text fields
  content: z.string()
    .min(1, 'Content is required'),

  // Optional text field
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional()
    .default(''),

  // Enum fields
  status: postStatusSchema.default('draft'),
  category: postCategorySchema,

  // Boolean fields
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  is_pinned: z.boolean().default(false),

  // DateTime fields
  published_at: z.string()
    .datetime()
    .optional()
    .nullable(),

  scheduled_at: z.string()
    .datetime()
    .optional()
    .nullable(),

  // JSON array field
  tags: z.array(z.string()).default([]),

  // JSON object field
  metadata: z.record(z.string(), z.any()).optional().default({}),
})

// Update schema (all fields optional except id)
export const updatePostSchema = createPostSchema.partial()

// Filter schema
export const postFilterSchema = z.object({
  search: z.string().optional(),
  status: postStatusSchema.optional(),
  category: postCategorySchema.optional(),
  author_id: z.number().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
})

// Sort schema
export const postSortSchema = z.object({
  field: z.enum(['created_at', 'published_at', 'title', 'view_count', 'like_count', 'rating']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// Export types from schemas
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostFilterInput = z.infer<typeof postFilterSchema>
export type PostSortInput = z.infer<typeof postSortSchema>

// Form validation helpers
export const validatePostForm = (data: unknown) => {
  return createPostSchema.safeParse(data)
}

export const validatePostUpdate = (data: unknown) => {
  return updatePostSchema.safeParse(data)
}

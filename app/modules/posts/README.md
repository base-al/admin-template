# Posts Module

A comprehensive module template that demonstrates **ALL possible field types** and patterns in the Base Framework frontend architecture.

## Purpose

This module serves as a **reference template** for creating new modules. It includes examples of every field type, validation pattern, and UI component you might need.

## Field Types Covered

### Text Fields
- **String** (`title`, `slug`) - Short text with length validation
- **Text** (`content`, `excerpt`) - Long text content

### Numeric Fields
- **Integer** (`view_count`, `like_count`, `comment_count`) - Whole numbers
- **Float** (`rating`) - Decimal numbers

### Boolean Fields
- **Boolean** (`published`, `featured`, `is_pinned`) - True/false flags

### Enum Fields
- **Status Enum** (`status`) - Draft, Published, Archived, Scheduled
- **Category Enum** (`category`) - News, Tutorial, Announcement, Blog

### DateTime Fields
- **DateTime** (`published_at`, `scheduled_at`) - Date and time selection
- **Timestamps** (`created_at`, `updated_at`) - Auto-managed timestamps

### Relationship Fields
- **Foreign Key** (`author_id`) - References to other models

### JSON Fields
- **JSON Array** (`tags`) - Array of strings
- **JSON Object** (`metadata`) - Key-value pairs

### File Fields
- **File Upload** (`featured_image`) - Image/file uploads with preview

## Module Structure

```
modules/posts/
├── stores/
│   └── posts.ts              # Pinia store with CRUD operations
├── types/
│   └── post.ts               # TypeScript interfaces
├── schemas/
│   └── post.schema.ts        # Zod validation schemas
├── utils/
│   └── formatters.ts         # Formatting and helper functions
├── components/
│   ├── PostFormModal.vue     # Create/Edit form modal
│   └── PostsTable.vue        # Data table with actions
├── pages/
│   ├── index.vue             # List view with filters
│   └── [id].vue              # Detail view
├── module.config.ts          # Module configuration
└── README.md                 # This file
```

## Key Features

### Store (Pinia)
- CRUD operations (create, read, update, delete)
- Pagination support
- Filtering and sorting
- Loading and error states
- Computed getters (publishedPosts, draftPosts, etc.)

### Form Validation (Zod)
- Required field validation
- String length validation
- Email/URL format validation
- Enum validation
- Custom regex validation
- Optional/nullable fields

### Components
- **PostFormModal**: Full-featured form with all field types
- **PostsTable**: Sortable table with inline actions
- File upload with preview
- Tag management
- Boolean toggles
- DateTime pickers
- Select dropdowns

### Utilities
- Status/category formatters
- Color mapping for badges
- DateTime formatting (absolute and relative)
- Number formatting
- Text truncation
- Slug generation

## Usage as Template

When creating a new module, use this as a reference:

1. **Copy the structure**:
   ```bash
   cp -r modules/posts modules/your-module
   ```

2. **Update module.config.ts** with your module details

3. **Modify types** in `types/` to match your data model

4. **Update schemas** in `schemas/` for validation rules

5. **Adjust components** to show/hide fields you need

6. **Update formatters** in `utils/` for your specific needs

## Integration

### 1. Register Store
The store is auto-imported by Nuxt (no manual registration needed)

### 2. Add Navigation
Add to your navigation config:
```typescript
{
  label: 'Posts',
  icon: 'i-lucide-file-text',
  to: '/app/posts',
  permission: 'post:list',
}
```

### 3. Add Permissions
Ensure your backend has these permissions:
- `post:create`
- `post:read`
- `post:update`
- `post:delete`
- `post:list`

## API Endpoints Expected

The store expects these API endpoints:

- `GET /api/posts` - List posts (with pagination, filtering)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Response Format
```typescript
{
  data: Post | Post[],
  meta?: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}
```

## Nuxt UI v4 Patterns

This module uses Nuxt UI v4 conventions:

### Modal Structure
```vue
<UModal v-model="isOpen">
  <template #header>Title</template>
  <div>Content</div>
  <template #footer>Actions</template>
</UModal>
```

### Table Columns
```typescript
const columns: TableColumn<Post>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
]
```

### Table Slots
```vue
<template #status-data="{ row }">
  {{ row.original.status }}
</template>
```

### Color Palette
- `success` - Green (replaces 'green')
- `error` - Red (replaces 'red')
- `neutral` - Gray (replaces 'gray')
- `info` - Blue
- `warning` - Orange
- `primary` - Brand color

## Field Type Examples

### Adding a String Field
```typescript
// types/post.ts
export interface Post {
  subtitle: string
}

// schemas/post.schema.ts
subtitle: z.string()
  .min(1, 'Subtitle is required')
  .max(255, 'Subtitle must be less than 255 characters'),

// PostFormModal.vue
<UFormGroup label="Subtitle" required>
  <UInput v-model="form.subtitle" placeholder="Enter subtitle" />
</UFormGroup>
```

### Adding an Enum Field
```typescript
// types/post.ts
export type Priority = 'low' | 'medium' | 'high'

// schemas/post.schema.ts
export const prioritySchema = z.enum(['low', 'medium', 'high'])
priority: prioritySchema.default('medium'),

// PostFormModal.vue
<UFormGroup label="Priority">
  <USelect v-model="form.priority" :options="priorityOptions" />
</UFormGroup>

// utils/formatters.ts
export const getPriorityColor = (priority: Priority) => {
  const colorMap = {
    low: 'success',
    medium: 'warning',
    high: 'error',
  }
  return colorMap[priority]
}
```

### Adding a Boolean Field
```typescript
// types/post.ts
export interface Post {
  is_archived: boolean
}

// schemas/post.schema.ts
is_archived: z.boolean().default(false),

// PostFormModal.vue
<UFormGroup>
  <UCheckbox v-model="form.is_archived" label="Archived" />
</UFormGroup>
```

### Adding a DateTime Field
```typescript
// types/post.ts
export interface Post {
  expires_at: string | null
}

// schemas/post.schema.ts
expires_at: z.string().datetime().optional().nullable(),

// PostFormModal.vue
<UFormGroup label="Expires At">
  <UInput v-model="form.expires_at" type="datetime-local" />
</UFormGroup>
```

## Best Practices

1. **Always validate** - Use Zod schemas for all forms
2. **Type everything** - Use TypeScript interfaces
3. **Format data** - Use formatters for display
4. **Handle errors** - Always catch and show user-friendly errors
5. **Show loading states** - Use loading flags in store
6. **Refresh after mutations** - Call `fetchPosts()` after create/update/delete
7. **Use computed getters** - For filtered/derived data
8. **Keep stores simple** - One store per resource
9. **Component composition** - Break down large forms
10. **Follow Nuxt UI v4** - Use proper color names and component structure

## TODO

Future enhancements for this template:

- [ ] Add bulk actions (delete multiple, bulk publish)
- [ ] Add export functionality (CSV, JSON)
- [ ] Add import functionality
- [ ] Add advanced search with operators
- [ ] Add column visibility toggle
- [ ] Add saved filter presets
- [ ] Add audit log/history
- [ ] Add comments/notes system
- [ ] Add rich text editor for content
- [ ] Add image cropping for featured image
- [ ] Add SEO metadata fields
- [ ] Add social media preview

## License

Part of the Base Framework starter kit.

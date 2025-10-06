/**
 * Posts Module Configuration
 *
 * This module demonstrates ALL possible field types and patterns
 * that can be used in a Base Framework frontend module.
 *
 * Use this as a template for generating new modules.
 */

export const postsModule = {
  name: 'posts',
  displayName: 'Posts',
  description: 'Content management module with all field types',
  icon: 'i-lucide-file-text',

  // Routes configuration
  routes: {
    list: '/app/posts',
    create: '/app/posts/create',
    view: '/app/posts/:id',
    edit: '/app/posts/:id/edit',
  },

  // Permissions required
  permissions: {
    view: 'post:read',
    create: 'post:create',
    update: 'post:update',
    delete: 'post:delete',
    list: 'post:list',
  },

  // Navigation menu item
  navigation: {
    label: 'Posts',
    icon: 'i-lucide-file-text',
    to: '/app/posts',
    permission: 'post:list',
    order: 10,
  },

  // Field types demonstrated in this module
  fieldTypes: {
    // Text fields
    string: ['title', 'slug'],
    text: ['content', 'excerpt'],

    // Numeric fields
    integer: ['view_count', 'like_count', 'comment_count'],
    float: ['rating'],

    // Boolean fields
    boolean: ['published', 'featured', 'is_pinned'],

    // Enum fields
    enum: {
      status: ['draft', 'published', 'archived', 'scheduled'],
      category: ['news', 'tutorial', 'announcement', 'blog'],
    },

    // Date/Time fields
    datetime: ['published_at', 'scheduled_at', 'created_at', 'updated_at'],

    // Relationship fields
    foreignKey: ['author_id'],

    // JSON fields
    jsonArray: ['tags'],
    jsonObject: ['metadata'],

    // File fields
    file: ['featured_image'],
  },

  // Module structure
  structure: {
    stores: ['posts.ts'],
    types: ['post.ts'],
    schemas: ['post.schema.ts'],
    utils: ['formatters.ts'],
    components: [
      'PostFormModal.vue',
      'PostsTable.vue',
    ],
    pages: [
      'index.vue',
      '[id].vue',
    ],
  },
}

export default postsModule

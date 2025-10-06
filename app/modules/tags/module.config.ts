/**
 * Tag Module Configuration
 *
 * Auto-generated module configuration for the Tag module.
 */

export const tagsModule = {
  name: 'tags',
  displayName: 'Tags',
  description: 'Tag management module',
  icon: 'i-lucide-box',

  // Routes configuration
  routes: {
    list: '/app/tags',
    create: '/app/tags/create',
    view: '/app/tags/:id',
    edit: '/app/tags/:id/edit',
  },

  // Permissions required
  permissions: {
    view: 'tag:read',
    create: 'tag:create',
    update: 'tag:update',
    delete: 'tag:delete',
    list: 'tag:list',
  },

  // Navigation menu item
  navigation: {
    label: 'Tags',
    icon: 'i-lucide-box',
    to: '/app/tags',
    permission: 'tag:list',
    order: 100,
  },
}

export default tagsModule

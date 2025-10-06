/**
 * Product Module Configuration
 *
 * Auto-generated module configuration for the Product module.
 */

export const productsModule = {
  name: 'products',
  displayName: 'Products',
  description: 'Product management module',
  icon: 'i-lucide-box',

  // Routes configuration
  routes: {
    list: '/app/products',
    create: '/app/products/create',
    view: '/app/products/:id',
    edit: '/app/products/:id/edit',
  },

  // Permissions required
  permissions: {
    view: 'product:read',
    create: 'product:create',
    update: 'product:update',
    delete: 'product:delete',
    list: 'product:list',
  },

  // Navigation menu item
  navigation: {
    label: 'Products',
    icon: 'i-lucide-box',
    to: '/app/products',
    permission: 'product:list',
    order: 100,
  },
}

export default productsModule

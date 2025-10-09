export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const { hasPermission } = useAuthorization()
  
  // Skip permission checks for public routes
  const publicRoutes = ['/']
  if (publicRoutes.includes(to.path)) {
    return
  }
  
  // Skip if user is not authenticated (handled by auth middleware)
  if (!authStore.isAuthenticated) {
    return
  }
  
  // Define route permission mappings
  const routePermissions: Record<string, { resource: string; action: string }> = {
    // Employee routes
    '/app/users': { resource: 'employee', action: 'list' },
    '/app/users/new': { resource: 'employee', action: 'create' },
    
    // Role routes
    '/app/users/roles': { resource: 'role', action: 'list' },
    '/app/users/roles/new': { resource: 'role', action: 'create' },
    
    // Permission routes  
    '/app/users/roles/permissions': { resource: 'permission', action: 'list' },
    
    // Customer routes
    '/app/customers': { resource: 'customer', action: 'list' },
    '/app/customers/new': { resource: 'customer', action: 'create' },
    
    // Business customer routes
    '/app/business-customers': { resource: 'business_customer', action: 'list' },
    '/app/business-customers/new': { resource: 'business_customer', action: 'create' },
    
    // Order routes
    '/app/orders': { resource: 'order', action: 'list' },
    '/app/orders/new': { resource: 'order', action: 'create' },
    
    // Plan routes
    '/app/plans': { resource: 'plan', action: 'list' },
    '/app/plans/new': { resource: 'plan', action: 'create' },
    
    // Settings routes
    '/app/settings': { resource: 'settings', action: 'read' },
  }
  
  // Check for dynamic routes with parameters
  const checkDynamicRoute = (path: string) => {
    // Role detail routes
    if (path.match(/^\/app\/employees\/roles\/\d+$/)) {
      return { resource: 'role', action: 'read' }
    }
    if (path.match(/^\/app\/employees\/roles\/\d+\/edit$/)) {
      return { resource: 'role', action: 'update' }
    }
    if (path.match(/^\/app\/employees\/roles\/\d+\/permissions$/)) {
      return { resource: 'permission', action: 'assign' }
    }
    
    // Employee detail routes
    if (path.match(/^\/app\/employees\/\d+$/)) {
      return { resource: 'employee', action: 'read' }
    }
    if (path.match(/^\/app\/employees\/\d+\/edit$/)) {
      return { resource: 'employee', action: 'update' }
    }
    
    // Customer detail routes
    if (path.match(/^\/app\/customers\/\d+$/)) {
      return { resource: 'customer', action: 'read' }
    }
    if (path.match(/^\/app\/customers\/\d+\/edit$/)) {
      return { resource: 'customer', action: 'update' }
    }
    
    // Business customer detail routes
    if (path.match(/^\/app\/business-customers\/\d+$/)) {
      return { resource: 'business_customer', action: 'read' }
    }
    if (path.match(/^\/app\/business-customers\/\d+\/edit$/)) {
      return { resource: 'business_customer', action: 'update' }
    }
    
    // Order detail routes
    if (path.match(/^\/app\/orders\/\d+$/)) {
      return { resource: 'order', action: 'read' }
    }
    
    // Plan detail routes
    if (path.match(/^\/app\/plans\/\d+$/)) {
      return { resource: 'plan', action: 'read' }
    }
    if (path.match(/^\/app\/plans\/\d+\/edit$/)) {
      return { resource: 'plan', action: 'update' }
    }
    
    return undefined
  }
  
  // Get permission requirement for current route
  let permissionRequired = routePermissions[to.path]
  
  // If not found in static routes, check dynamic routes
  if (!permissionRequired) {
    permissionRequired = checkDynamicRoute(to.path)
  }
  
  // If no permission requirement defined, allow access (might be a generic page)
  if (!permissionRequired) {
    return
  }
  
  // Check if user has required permission
  const { resource, action } = permissionRequired
  
  try {
    // Initialize authorization if not already done
    const { initialize } = useAuthorization()
    await initialize()
    
    if (!hasPermission(resource, action)) {
      // User doesn't have permission, redirect to dashboard with error message
      const toast = useToast()
      toast.add({
        title: 'Access Denied',
        description: `You don't have permission to access this page. Required: ${resource}:${action}`,
        color: 'error'
      })
      
      return navigateTo('/app/dashboard')
    }
  } catch (error) {
    console.error('Permission check failed:', error)
    // On error, redirect to dashboard
    return navigateTo('/app/dashboard')
  }
})
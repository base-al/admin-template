export default defineNuxtRouteMiddleware((to, _from) => {
  const authStore = useAuthStore()
  
  // Public routes that don't require authentication
  const publicRoutes = ['/']
  
  // Routes that should redirect to dashboard if already logged in
  const guestOnlyRoutes = ['/']
  
  const isPublicRoute = publicRoutes.includes(to.path)
  const isGuestOnlyRoute = guestOnlyRoutes.includes(to.path)
  
  // If user is not authenticated and trying to access protected route
  if (!authStore.isAuthenticated && !isPublicRoute) {
    return navigateTo('/')
  }
  
  // If user is authenticated and trying to access guest-only route (login page)
  if (authStore.isAuthenticated && isGuestOnlyRoute) {
    return navigateTo('/app/dashboard')
  }
})
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Initialize auth state from localStorage/cookies
  await authStore.initialize()
  
 
  const route = useRoute()
  
  // If user is authenticated and on login page, redirect to dashboard
  if (authStore.isAuthenticated && route.path === '/') {
    await navigateTo('/app/dashboard')
  }
})
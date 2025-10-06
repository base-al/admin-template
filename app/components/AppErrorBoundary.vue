<template>
  <div>
    <!-- Show API connection error if detected -->
    <ApiErrorPage
      v-if="showApiError"
      :error="apiHealth.health.value.lastError"
      :retry-attempts="apiHealth.health.value.retryAttempts"
      :last-checked="apiHealth.health.value.lastChecked"
      @retry="handleRetry"
    />
    
    <!-- Show normal content when API is healthy -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const apiHealth = useApiHealth()
const router = useRouter()
const route = useRoute()

const showApiError = computed(() => {
  // Don't show API error on error pages themselves
  if (route.path.startsWith('/error/')) {
    return false
  }
  
  // Show error if API is unhealthy
  return !apiHealth.health.value.isHealthy
})

const handleRetry = async () => {
  await apiHealth.checkApiHealth()
  
  // If connection is restored, refresh current page data
  if (apiHealth.health.value.isHealthy) {
    // Trigger a soft refresh to reload data
    await refreshCookie()
    await router.replace(route.fullPath)
  }
}

// Watch for API health changes and handle appropriately
watch(
  () => apiHealth.health.value.isHealthy,
  (isHealthy, wasHealthy) => {
    // If API goes from healthy to unhealthy
    if (wasHealthy && !isHealthy && !route.path.startsWith('/error/')) {
      console.warn('API connection lost, showing error page')
    }
    
    // If API recovers, we don't need to do anything here
    // as the template will automatically show normal content
  }
)
</script>
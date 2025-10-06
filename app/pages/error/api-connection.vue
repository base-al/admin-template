<template>
  <div>
    <ApiErrorPage
      :error="apiHealth.health.value.lastError"
      :retry-attempts="apiHealth.health.value.retryAttempts"
      :last-checked="apiHealth.health.value.lastChecked"
      @retry="handleRetry"
    />
  </div>
</template>

<script setup lang="ts">
// Disable layout for this page
definePageMeta({
  layout: false
})

const apiHealth = useApiHealth()
 
const handleRetry = async () => {
  // Try to reconnect
  await apiHealth.checkApiHealth()
  
  // If connection is restored, redirect back to previous page or home
  if (apiHealth.health.value.isHealthy) {
    // Try to go back to previous page, fallback to home
    const previousRoute = document.referrer
    if (previousRoute && !previousRoute.includes('/error/')) {
      window.history.back()
    } else {
      await navigateTo('/app')
    }
  }
}

// Auto-retry on mount
onMounted(() => {
  // Start health checking
  apiHealth.startHealthChecking()
  
  // Try immediate reconnection
  setTimeout(() => {
    if (!apiHealth.health.value.isHealthy) {
      apiHealth.checkApiHealth()
    }
  }, 1000)
})

// Set page title
useHead({
  title: 'Connection Problem - Negenet Admin'
})
</script>
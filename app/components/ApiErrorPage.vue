<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="text-center">
        <!-- Error Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <UIcon name="i-lucide-wifi-off" class="h-8 w-8 text-red-600" />
        </div>

        <!-- Error Title -->
        <h1 class="text-2xl font-bold text-gray-900 mb-4">
          Connection Problem
        </h1>

        <!-- Error Message -->
        <p class="text-gray-600 mb-6">
          {{ errorMessage }}
        </p>

        <!-- Error Details (if available) -->
        <div v-if="showDetails" class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Technical Details:</h3>
          <p class="text-xs text-gray-600 font-mono break-words">
            {{ detailedError }}
          </p>
          <p class="text-xs text-gray-500 mt-2">
            Last checked: {{ lastChecked }}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <UButton
            block
            :loading="isRetrying"
            color="primary"
            @click="handleRetry"
          >
            <template v-if="!isRetrying">
              <UIcon name="i-lucide-refresh-cw" class="mr-2" />
              Try Again
            </template>
            <template v-else>
              Retrying...
            </template>
          </UButton>

          <UButton
            block
            variant="ghost"
            @click="showDetails = !showDetails"
          >
            <UIcon :name="showDetails ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="mr-2" />
            {{ showDetails ? 'Hide Details' : 'Show Details' }}
          </UButton>

          <div class="text-sm text-gray-500 mt-4">
            <p>If the problem persists, please:</p>
            <ul class="mt-2 space-y-1 text-left">
              <li>• Check your internet connection</li>
              <li>• Verify the server is running</li>
              <li>• Contact your system administrator</li>
            </ul>
          </div>
        </div>

        <!-- Retry Counter -->
        <div v-if="retryAttempts > 0" class="mt-4 text-xs text-gray-400">
          Retry attempt {{ retryAttempts }} of 3
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error?: string | null
  retryAttempts?: number
  lastChecked?: Date | null
  onRetry?: () => Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  retryAttempts: 0,
  lastChecked: null,
  onRetry: undefined
})

const emit = defineEmits<{
  retry: []
}>()

const showDetails = ref(false)
const isRetrying = ref(false)

const errorMessage = computed(() => {
  if (!props.error) {
    return "We're having trouble connecting to the server. Please check your connection and try again."
  }
  
  // User-friendly error messages
  if (props.error.includes('Connection refused')) {
    return "The server is not responding. It may be temporarily unavailable."
  }
  
  if (props.error.includes('Server not found')) {
    return "Cannot find the server. Please check the server address."
  }
  
  if (props.error.includes('timeout')) {
    return "The server is taking too long to respond. Please try again."
  }
  
  if (props.error.includes('Network')) {
    return "There's a problem with your network connection. Please check your internet and try again."
  }
  
  return "We're having trouble connecting to the server. Please try again."
})

const detailedError = computed(() => {
  return props.error || 'Unknown connection error'
})

const lastChecked = computed(() => {
  if (!props.lastChecked) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(props.lastChecked)
})

const handleRetry = async () => {
  isRetrying.value = true
  
  try {
    if (props.onRetry) {
      await props.onRetry()
    } else {
      emit('retry')
    }
  } catch (error) {
    console.error('Retry failed:', error)
  } finally {
    isRetrying.value = false
  }
}
</script>
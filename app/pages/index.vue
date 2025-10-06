<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Negenet Admin
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          ISP Management System
        </p>
      </div>
      
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium">Sign in to your account</h3>
        </template>
        
        <form class="space-y-4" @submit.prevent="handleLogin">
          <UFormField label="Email" required>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="admin@negenet.com"
              required
            />
          </UFormField>
          
          <UFormField label="Password" required>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              required
            />
          </UFormField>
          
          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>
          
          <UButton 
            type="submit" 
            :loading="isLoading" 
            block
            size="lg"
          >
            Sign in
          </UButton>
        </form>
      </UCard>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

const { login, isAuthenticated, isLoading } = useAuth()

const form = reactive({
  email: '',
  password: ''
})

const error = ref('')

const handleLogin = async () => {
  error.value = ''
  const result = await login(form)
  if (!result.success) {
    error.value = result.error
  }
}

// Redirect if already authenticated
watchEffect(() => {
  if (isAuthenticated.value) {
    navigateTo('/app/dashboard')
  }
})
</script>
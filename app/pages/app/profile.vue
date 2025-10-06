<script setup lang="ts">
definePageMeta({
  title: 'Profile',
  description: 'User profile and account settings'
})

const authStore = useAuthStore()

const user = computed(() => authStore.currentUser)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UDashboardSection title="User Profile" description="Manage your profile information">
        <UCard v-if="user">
          <div class="space-y-6">
            <div class="flex items-center gap-4">
              <UAvatar
                :src="user.avatar"
                :alt="user.name || user.username"
                size="xl"
              />
              <div>
                <h3 class="text-lg font-semibold">
                  {{ user.name || `${user.first_name} ${user.last_name}`.trim() || user.username }}
                </h3>
                <p class="text-sm text-gray-600">{{ user.email }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-medium mb-2">Personal Information</h4>
                <div class="space-y-2 text-sm">
                  <div><span class="font-medium">Username:</span> {{ user.username }}</div>
                  <div><span class="font-medium">Email:</span> {{ user.email }}</div>
                  <div v-if="user.first_name"><span class="font-medium">First Name:</span> {{ user.first_name }}</div>
                  <div v-if="user.last_name"><span class="font-medium">Last Name:</span> {{ user.last_name }}</div>
                </div>
              </div>

              <div>
                <h4 class="font-medium mb-2">Account Details</h4>
                <div class="space-y-2 text-sm">
                  <div><span class="font-medium">User ID:</span> {{ user.id }}</div>
                  <div v-if="user.created_at"><span class="font-medium">Member Since:</span> {{ $d(new Date(user.created_at), 'short') }}</div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
        
        <UCard v-else>
          <div class="text-center py-8">
            <UIcon name="i-lucide-user-x" class="text-gray-400 text-4xl mb-4" />
            <p class="text-gray-600">No user information available</p>
          </div>
        </UCard>
      </UDashboardSection>
    </template>
  </UDashboardPanel>
</template>
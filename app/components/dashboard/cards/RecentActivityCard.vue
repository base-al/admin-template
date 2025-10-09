<script setup lang="ts">
// Note: This component shows recent activity from your system.
// Customize this to show data from stores that exist in your project.
// By default it shows a placeholder state since stores may vary by project.

interface ActivityItem {
  id: string
  type: 'user' | 'system'
  title: string
  description: string
  timestamp: string
  icon: string
  iconColor: string
  href?: string
}

// Placeholder activities - customize this to fetch from your actual stores
const recentActivities = ref<ActivityItem[]>([])
const isLoading = ref(false)

// Example: Uncomment and customize based on your generated modules
// onMounted(async () => {
//   const usersStore = useUsersStore()
//   await usersStore.fetchUsers()
//
//   const recentUsers = (usersStore.users || [])
//     .slice()
//     .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
//     .slice(0, 10)
//
//   recentUsers.forEach(user => {
//     recentActivities.value.push({
//       id: `user-${user.id}`,
//       type: 'user',
//       title: 'New user registered',
//       description: user.name || user.email,
//       timestamp: user.created_at,
//       icon: 'i-lucide-user-plus',
//       iconColor: 'text-blue-500',
//       href: `/app/users/${user.id}`
//     })
//   })
// })

// Format relative time
const formatRelativeTime = (timestamp: string) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return time.toLocaleDateString()
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-activity" class="text-blue-500" />
        <h3 class="text-lg font-semibold">Recent Activity</h3>
      </div>
    </template>

    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="animate-pulse flex items-center gap-3">
        <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"/>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"/>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"/>
        </div>
      </div>
    </div>

    <div v-else-if="recentActivities.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-inbox" class="text-gray-400 text-4xl mb-2" />
      <p class="text-gray-500">No recent activity</p>
    </div>

    <div v-else class="space-y-3">
      <ULink
        v-for="activity in recentActivities"
        :key="activity.id"
        :to="activity.href"
        class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div class="flex items-start gap-3">
          <UIcon 
            :name="activity.icon" 
            :class="[activity.iconColor, 'text-lg mt-0.5']"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ activity.title }}
              </h4>
              <span class="text-xs text-gray-500 whitespace-nowrap ml-2">
                {{ formatRelativeTime(activity.timestamp) }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              {{ activity.description }}
            </p>
          </div>
        </div>
      </ULink>
    </div>

    <!-- Footer removed - no activity page in starter kit -->
    <!-- Re-enable when implementing activity tracking:
    <template #footer>
      <UButton
        to="/app/activity"
        variant="ghost"
        size="sm"
        block
        class="justify-center"
      >
        View All Activity
      </UButton>
    </template>
    -->
  </UCard>
</template>
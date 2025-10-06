<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard()

// Notifications feature placeholder - can be implemented when needed
const notifications = ref<any[]>([])
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
  >
    <template #body>
      <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <UIcon name="i-lucide-bell-off" class="w-12 h-12 text-gray-400 mb-4" />
        <p class="text-gray-600 font-medium">No notifications</p>
        <p class="text-gray-400 text-sm mt-1">You're all caught up!</p>
      </div>

      <!-- Notifications will be displayed here when implemented -->
      <div v-else>
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-center gap-3 relative -mx-3 first:-mt-3 last:-mb-3"
        >
          <div class="text-sm flex-1">
            <p class="text-highlighted font-medium">{{ notification.title }}</p>
            <p class="text-dimmed">{{ notification.body }}</p>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

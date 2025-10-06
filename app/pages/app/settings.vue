<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

// Get settings store
const settingsStore = useSettingsStore()

// Define icon mapping for different groups
const groupIcons: Record<string, string> = {
  company: 'i-lucide-building',
  financial: 'i-lucide-credit-card',
  system: 'i-lucide-settings',
  email: 'i-lucide-mail',
  service: 'i-lucide-server',
  radius: 'i-lucide-radio',
  olt: 'i-lucide-network'
}

// Load settings to get available groups
await settingsStore.fetchSettings()

// Get unique groups from settings
const settingGroups = computed(() => {
  const groups = [...new Set(settingsStore.settings.map(setting => setting.group))]
  return groups.sort()
})

// Create dynamic navigation links based on database groups
const links = computed(() => {
  const navigationItems = settingGroups.value.map(group => ({
    label: group.charAt(0).toUpperCase() + group.slice(1), // Capitalize first letter
    icon: groupIcons[group] || 'i-lucide-settings', // Default to settings icon
    to: group === 'company' ? '/app/settings' : `/app/settings/${group}`,
    exact: group === 'company'
  }))
  
  return [navigationItems] satisfies NavigationMenuItem[][]
})
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

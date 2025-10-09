<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { getModuleNavigationItems } from '~/modules'

type CustomNavigationMenuItem = NavigationMenuItem & {
  type?: 'trigger' | 'label' | 'link'
  permission?: string // Format: "resource:action"
  group?: string // Group name for organizing navigation
}

const route = useRoute()
const authStore = useAuthStore()
const { hasPermission } = useAuthorization()

const open = ref(false)

// Get module navigation items automatically
const moduleNavItems = getModuleNavigationItems()

// Define all navigation items (core + modules)
const allNavigationItems: CustomNavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-house',
    to: '/app/dashboard',
    group: 'main', // Dashboard always in main group
    onSelect: () => {
      open.value = false
    }
  },
  // Automatically add module navigation items
  ...moduleNavItems.map(item => ({
    ...item,
    group: item.group || 'main', // Default to 'main' group if not specified
    onSelect: () => {
      open.value = false
    }
  })),
  // Core system items (always in 'system' group)
  {
    label: 'Media',
    to: '/app/media',
    icon: 'i-lucide-image',
    permission: 'media:list',
    group: 'system',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Users',
    to: '/app/users',
    icon: 'i-lucide-users',
    permission: 'employee:list',
    group: 'system',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Settings',
    to: '/app/settings',
    icon: 'i-lucide-settings',
    permission: 'settings:read',
    group: 'system',
    onSelect: () => {
      open.value = false
    }
  }
]

// Filter and group navigation items based on permissions
const links = computed(() => {
  // First, filter items based on permissions
  const filteredItems = allNavigationItems.filter((link: CustomNavigationMenuItem) => {
    // Always show dashboard
    if (link.to === '/app/dashboard') return true

    // Check permission if specified
    if (link.permission) {
      const [resource, action] = link.permission.split(':')
      if (!resource || !action || !hasPermission(resource, action)) return false
    }

    // Filter children if they exist
    if (link.children !== undefined) {
      const filteredChildren = link.children.filter((child: CustomNavigationMenuItem) => {
        if (child.permission) {
          const [resource, action] = child.permission.split(':')
          return resource && action && hasPermission(resource, action)
        }
        return true
      })

      // Only show parent if it has visible children
      if (filteredChildren.length === 0) return false

      // Update children with filtered list
      link.children = filteredChildren
    }

    return true
  })

  // Group items by their group property
  const groupedItems: Record<string, CustomNavigationMenuItem[]> = {}

  filteredItems.forEach(item => {
    const groupName = item.group || 'main'
    if (!groupedItems[groupName]) {
      groupedItems[groupName] = []
    }
    groupedItems[groupName].push(item)
  })

  // Convert to array of arrays, ensuring 'main' comes first, 'system' last
  const result: CustomNavigationMenuItem[][] = []

  // Add 'main' group first
  if (groupedItems.main && groupedItems.main.length > 0) {
    result.push(groupedItems.main)
  }

  // Add other groups (excluding 'main' and 'system')
  Object.keys(groupedItems)
    .filter(key => key !== 'main' && key !== 'system')
    .sort() // Sort alphabetically
    .forEach(key => {
      if (groupedItems[key] && groupedItems[key].length > 0) {
        result.push(groupedItems[key])
      }
    })

  // Add 'system' group last
  if (groupedItems.system && groupedItems.system.length > 0) {
    result.push(groupedItems.system)
  }

  return result
}) satisfies ComputedRef<CustomNavigationMenuItem[][]>

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat() as CustomNavigationMenuItem[],
}])

// Initialize auth store and permissions
onMounted(async () => {
  await authStore.initialize()
  
  // Initialize permissions after auth is loaded (non-blocking)
  if (authStore.isAuthenticated) {
    const { initialize } = useAuthorization()
    // Don't await - let it load in background to avoid blocking UI
    initialize().catch(error => {
      console.log('Failed to load permissions:', error)
    })
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <RoleMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <!-- Main navigation groups (all except last) -->
        <UNavigationMenu
          v-for="(group, index) in links.slice(0, -1)"
          :key="`nav-group-${index}`"
          :collapsed="collapsed"
          :items="group"
          orientation="vertical"
          tooltip
          popover
          :class="index > 0 ? 'mt-4' : ''"
        />

        <!-- Last group (system) - pushed to bottom with mt-auto -->
        <UNavigationMenu
          v-if="links.length > 0"
          :collapsed="collapsed"
          :items="links[links.length - 1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { getModuleNavigationItems } from '~/modules'

type CustomNavigationMenuItem = NavigationMenuItem & {
  type?: 'trigger' | 'label' | 'link'
  permission?: string // Format: "resource:action"
}

const route = useRoute()
const authStore = useAuthStore()
const { hasPermission } = useAuthorization()

const open = ref(false)

// Get module navigation items automatically
const moduleNavItems = getModuleNavigationItems()

// Define core navigation links (non-module links)
const allLinks: CustomNavigationMenuItem[][] = [[
  {
    label: 'Dashboard',
    icon: 'i-lucide-house',
    to: '/app/dashboard',
    onSelect: () => {
      open.value = false
    }
  },
  // Automatically add module navigation items
  ...moduleNavItems.map(item => ({
    ...item,
    onSelect: () => {
      open.value = false
    }
  }))
], [
  {
    label: 'Media',
    to: '/app/media',
    icon: 'i-lucide-image',
    permission: 'media:list',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Employees',
    to: '/app/employees',
    icon: 'i-lucide-users',
    permission: 'employee:list',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Settings',
    to: '/app/settings',
    icon: 'i-lucide-settings',
    permission: 'settings:read',
    onSelect: () => {
      open.value = false
    }
  }
]]

// Filter links based on user permissions
const links = computed(() => {
  return allLinks.map(group => 
    group.filter((link: CustomNavigationMenuItem) => {
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
  ).filter(group => group.length > 0) // Remove empty groups
}) satisfies ComputedRef<CustomNavigationMenuItem[][]>

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat() as CustomNavigationMenuItem[],
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
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

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
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
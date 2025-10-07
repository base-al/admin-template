<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const authStore = useAuthStore()
const authorizationStore = useAuthorizationStore()
const router = useRouter()
const { selectedDashboard, setSelectedDashboard, getCurrentRoleName } = useDashboardState()

// Role icon mapping - defaults for system roles and common patterns
const getRoleIcon = (roleName: string): string => {
  const iconMap: Record<string, string> = {
    'Super Admin': 'i-lucide-crown',
    'Administrator': 'i-lucide-shield',
    'Manager': 'i-lucide-briefcase',
    'Employee': 'i-lucide-user',
    'Viewer': 'i-lucide-eye',
    // Add more default patterns based on common role names
    'Support': 'i-lucide-headphones',
    'Sales': 'i-lucide-trending-up',
    'Finance': 'i-lucide-dollar-sign',
    'Technical': 'i-lucide-wrench',
  }

  // Try exact match
  if (iconMap[roleName]) return iconMap[roleName]

  // Try partial match (case insensitive)
  const lowerName = roleName.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key.toLowerCase())) {
      return icon
    }
  }

  // Default icon for custom roles
  return 'i-lucide-circle-user'
}

// Get all available roles dynamically from the store
const availableRoles = computed(() => {
  return authorizationStore.roles.map(role => ({
    label: `${role.name} Dashboard`,
    role: role.name,
    icon: getRoleIcon(role.name),
    description: role.description || `${role.name} access`,
    route: '/app/dashboard',
    isSystem: role.is_system
  }))
})


// Determine if current user is admin (Super Admin or Administrator)
const isAdminRole = computed(() => {
  const userRoleName = getCurrentRoleName()
  return userRoleName === 'Super Admin' || userRoleName === 'Administrator'
})

// Get available dashboards based on role
const availableDashboards = computed(() => {
  if (isAdminRole.value) {
    // Admin roles can access all dashboards
    return availableRoles.value
  } else {
    // Non-admin roles only see their specific dashboard
    const userRoleName = getCurrentRoleName()
    return availableRoles.value.filter(dashboard => dashboard.role === userRoleName)
  }
})

// Get current selected dashboard for display
const getCurrentSelectedDashboard = computed(() => {
  const currentSelection = selectedDashboard.value || getCurrentRoleName()
  
  // Find the dashboard object that matches the current selection
  const matchingDashboard = availableDashboards.value.find(dashboard => dashboard.role === currentSelection)
  
  // Fallback to user's default role if selected dashboard not in available list
  if (!matchingDashboard) {
    const userRoleName = getCurrentRoleName()
    return availableDashboards.value.find(dashboard => dashboard.role === userRoleName) || availableDashboards.value[0]
  }
  
  return matchingDashboard
})

// Navigate to dashboard (only for admin roles)
const navigateToDashboard = (dashboard: { role: string, route: string }) => {
  if (isAdminRole.value) {
    // Use the composable to update dashboard state
    setSelectedDashboard(dashboard.role)

    // Navigate to dashboard (will show the selected component)
    router.push(dashboard.route)
  }
  // Non-admin roles: No navigation, only update selectedDashboard (shows logo)
}

// Create dropdown items for admin roles, or empty for non-admin
const dropdownItems = computed<DropdownMenuItem[][]>(() => {
  if (!isAdminRole.value) {
    // Non-admin roles don't get a dropdown menu
    return []
  }
  
  const currentSelection = selectedDashboard.value || getCurrentRoleName()
  
  // Admin roles get full menu with active state
  return [availableDashboards.value.map(dashboard => ({
    ...dashboard,
    checked: dashboard.role === currentSelection,
    onSelect() {
      navigateToDashboard(dashboard)
    }
  }))]
})

// For non-admin roles, don't show dropdown
const showAsButton = computed(() => !isAdminRole.value)
</script>

<template>
  <!-- For non-admin roles: Show logo instead of role button -->
  <div
    v-if="showAsButton"
    class="flex items-center justify-center p-2"
  >
    <img
      src="/assets/svg/logo.svg"
      alt="Negenet Logo"
      :class="collapsed ? 'h-8 w-8' : 'h-10 w-auto max-w-full'"
    />
  </div>

  <!-- For admin roles: Show as dropdown menu -->
  <UDropdownMenu
    v-else
    :items="dropdownItems"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :icon="collapsed ? getCurrentSelectedDashboard?.icon : undefined"
      :label="collapsed ? undefined : getCurrentSelectedDashboard?.label"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>
</template>
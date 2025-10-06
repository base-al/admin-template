<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const authStore = useAuthStore()
const authorizationStore = useAuthorizationStore()
const router = useRouter()
const { selectedDashboard, setSelectedDashboard, getCurrentRoleName } = useDashboardState()

// Define all available role dashboards based on ISP roles
const roleDashboards = [
  {
    label: 'Super Admin Dashboard',
    role: 'Super Admin',
    icon: 'i-lucide-crown',
    description: 'Full system access - ISP owner/founder level',
    route: '/app/dashboard'
  },
  {
    label: 'Administrator Dashboard', 
    role: 'Administrator',
    icon: 'i-lucide-shield',
    description: 'System administration and user management',
    route: '/app/dashboard'
  },
  {
    label: 'Manager Dashboard',
    role: 'Manager', 
    icon: 'i-lucide-briefcase',
    description: 'Management oversight with business analytics',
    route: '/app/dashboard'
  },
  {
    label: 'Financial Manager Dashboard',
    role: 'Financial Manager',
    icon: 'i-lucide-dollar-sign',
    description: 'Financial dashboard, billing, invoicing',
    route: '/app/dashboard'
  },
  {
    label: 'Sales Representative Dashboard',
    role: 'Sales Representative',
    icon: 'i-lucide-trending-up',
    description: 'Sales dashboard, customer acquisition',
    route: '/app/dashboard'
  },
  {
    label: 'Technical Specialist Dashboard',
    role: 'Technical Specialist',
    icon: 'i-lucide-settings',
    description: 'Network operations, OLT/ONT management',
    route: '/app/dashboard'
  },
  {
    label: 'Support Agent Dashboard',
    role: 'Support Agent',
    icon: 'i-lucide-headphones',
    description: 'Customer support tickets and service requests',
    route: '/app/dashboard'
  },
  {
    label: 'Viewer Dashboard',
    role: 'Viewer',
    icon: 'i-lucide-eye',
    description: 'Read-only access for monitoring',
    route: '/app/dashboard'
  }
]


// Determine if current user is admin (Super Admin or Administrator)
const isAdminRole = computed(() => {
  const userRoleName = getCurrentRoleName()
  return userRoleName === 'Super Admin' || userRoleName === 'Administrator' || userRoleName === 'Owner'
})

// Get available dashboards based on role
const availableDashboards = computed(() => {
  if (isAdminRole.value) {
    // Admin roles can access all dashboards
    return roleDashboards
  } else {
    // Non-admin roles only see their specific dashboard
    const userRoleName = getCurrentRoleName()
    return roleDashboards.filter(dashboard => dashboard.role === userRoleName)
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
const navigateToDashboard = (dashboard: typeof roleDashboards[0]) => {
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
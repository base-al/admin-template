<script setup lang="ts">
import { sub } from 'date-fns'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Period, Range } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()
const { 
  selectedDashboard, 
  isAdminRole, 
  getCurrentRoleName, 
  initializeDashboard, 
  setSelectedDashboard, 
  getDashboardTitle 
} = useDashboardState()

// Initialize dashboard state on mount
onMounted(() => {
  initializeDashboard()
})

const currentRoleName = computed(() => getCurrentRoleName())

// All roles use the same AdminDashboard component
const AdminDashboard = defineAsyncComponent(() => import('~/components/dashboard/AdminDashboard.vue'))

// Role-specific quick actions
const getQuickActions = (roleName: string): DropdownMenuItem[][] => {
  const actions: Record<string, DropdownMenuItem[][]> = {
    'Super Admin': [[{
      label: 'New employee',
      icon: 'i-lucide-users',
      to: '/app/employees/new'
    }, {
      label: 'View reports',
      icon: 'i-lucide-bar-chart',
      to: '/app/reports'
    }]],
    'Administrator': [[{
      label: 'New employee',
      icon: 'i-lucide-users',
      to: '/app/employees/new'
    }, {
      label: 'View reports',
      icon: 'i-lucide-bar-chart',
      to: '/app/reports'
    }]],
    'Owner': [[{
      label: 'New employee',
      icon: 'i-lucide-users',
      to: '/app/employees/new'
    }, {
      label: 'View reports',
      icon: 'i-lucide-bar-chart',
      to: '/app/reports'
    }]],
    'Manager': [[{
      label: 'Team review',
      icon: 'i-lucide-user-check',
      to: '/app/employees'
    }, {
      label: 'View reports',
      icon: 'i-lucide-bar-chart',
      to: '/app/reports'
    }]],
    'Financial Manager': [[{
      label: 'Team review',
      icon: 'i-lucide-user-check',
      to: '/app/employees'
    }, {
      label: 'View reports',
      icon: 'i-lucide-bar-chart',
      to: '/app/reports'
    }]],
    'Technical Specialist': [[{
      label: 'Team review',
      icon: 'i-lucide-user-check',
      to: '/app/employees'
    }, {
      label: 'View reports',
      icon: 'i-lucide-bar-chart',
      to: '/app/reports'
    }]],
    'Support Agent': [[{
      label: 'Team review',
      icon: 'i-lucide-user-check',
      to: '/app/employees'
    }, {
      label: 'View reports',
      icon: 'i-lucide-bar-chart',
      to: '/app/reports'
    }]],
    'Sales Representative': [[{
      label: 'Team review',
      icon: 'i-lucide-user-check',
      to: '/app/employees'
    }, {
      label: 'View reports',
      icon: 'i-lucide-bar-chart',
      to: '/app/reports'
    }]]
  }
  return actions[roleName] ?? actions['Super Admin'] ?? []
}

const items = computed(() => getQuickActions(currentRoleName.value))

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('daily')

const dashboardTitle = computed(() => getDashboardTitle())
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar :title="dashboardTitle" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- NOTE: The `-ms-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
          <HomeDateRangePicker v-model="range" class="-ms-1" />

          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Admin Dashboard -->
      <Suspense>
        <AdminDashboard
          :period="period"
          :range="range"
        />
        <template #fallback>
          <div class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
            <span class="ml-2">Loading dashboard...</span>
          </div>
        </template>
      </Suspense>
    </template>
  </UDashboardPanel>
</template>
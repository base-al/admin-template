<template>
  <div class="space-y-6">
    <!-- System Overview -->
    <div>
      <h2 class="text-xl font-semibold mb-4">System Overview</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCardsStatCard
          title="Total Employees"
          :value="0"
          icon="i-lucide-users"
          color="blue"
        />
        <DashboardCardsStatCard
          title="Active Users"
          :value="0"
          icon="i-lucide-user-check"
          color="green"
        />
        <DashboardCardsStatCard
          title="System Health"
          value="100%"
          icon="i-lucide-activity"
          color="emerald"
        />
        <DashboardCardsStatCard
          title="Uptime"
          value="99.9%"
          icon="i-lucide-server"
          color="purple"
        />
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Activity (2/3 width) -->
      <div class="lg:col-span-2">
        <DashboardCardsRecentActivityCard />
      </div>

      <!-- Quick Actions (1/3 width) -->
      <div>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-zap" class="text-yellow-500" />
              <h3 class="text-lg font-semibold">Quick Actions</h3>
            </div>
          </template>
          <div class="space-y-3">
            <UButton
              block
              variant="outline"
              icon="i-lucide-users"
              to="/app/employees/new"
            >
              Add Employee
            </UButton>
            <UButton
              block
              variant="outline"
              icon="i-lucide-settings"
              to="/app/settings"
            >
              System Settings
            </UButton>
            <UButton
              block
              variant="outline"
              icon="i-lucide-bar-chart-3"
              to="/app/reports"
            >
              View Reports
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Period, Range } from '~/types'

defineProps<{
  period: Period
  range: Range
}>()
</script>
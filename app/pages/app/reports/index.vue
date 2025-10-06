<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Reports & Analytics
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        View business insights and generate reports
      </p>
    </div>

    <!-- Reports Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Customer Reports -->
      <UCard>
        <template #header>
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-users" class="w-5 h-5 text-blue-600" />
            <h3 class="text-lg font-semibold">Customer Reports</h3>
          </div>
        </template>
        
        <div class="space-y-3">
          <UButton variant="outline" block size="sm">
            Active Customers
          </UButton>
          <UButton variant="outline" block size="sm">
            New Signups
          </UButton>
          <UButton variant="outline" block size="sm">
            Churn Analysis
          </UButton>
        </div>
      </UCard>

      <!-- Revenue Reports -->
      <UCard>
        <template #header>
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-currency-dollar" class="w-5 h-5 text-green-600" />
            <h3 class="text-lg font-semibold">Revenue Reports</h3>
          </div>
        </template>
        
        <div class="space-y-3">
          <UButton variant="outline" block size="sm">
            Monthly Revenue
          </UButton>
          <UButton variant="outline" block size="sm">
            Payment History
          </UButton>
          <UButton variant="outline" block size="sm">
            Outstanding Invoices
          </UButton>
        </div>
      </UCard>

      <!-- Network Reports -->
      <UCard>
        <template #header>
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-wifi" class="w-5 h-5 text-purple-600" />
            <h3 class="text-lg font-semibold">Network Reports</h3>
          </div>
        </template>
        
        <div class="space-y-3">
          <UButton variant="outline" block size="sm">
            Bandwidth Usage
          </UButton>
          <UButton variant="outline" block size="sm">
            Connection Statistics
          </UButton>
          <UButton variant="outline" block size="sm">
            Network Performance
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Quick Stats -->
    <div class="mt-8">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Quick Statistics</h3>
        </template>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="p-4">
            <div class="text-2xl font-bold text-blue-600">{{ stats.totalCustomers }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Total Customers</div>
          </div>
          <div class="p-4">
            <div class="text-2xl font-bold text-green-600">${{ stats.monthlyRevenue }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</div>
          </div>
          <div class="p-4">
            <div class="text-2xl font-bold text-purple-600">{{ stats.activePlans }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Active Plans</div>
          </div>
          <div class="p-4">
            <div class="text-2xl font-bold text-orange-600">{{ stats.uptime }}%</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Network Uptime</div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const stats = ref({
  totalCustomers: 0,
  monthlyRevenue: 0,
  activePlans: 0,
  uptime: 99.9
})

onMounted(() => {
  // Load statistics from stores
  const customersStore = useCustomersStore()
  const plansStore = usePlansStore()
  
  stats.value.totalCustomers = customersStore.customers.length
  stats.value.activePlans = plansStore.activePlans.length
  stats.value.monthlyRevenue = 12450 // This would come from actual calculation
})
</script>
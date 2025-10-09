<script setup lang="ts">
import type { Permission } from '~/types'

// Page metadata
definePageMeta({
  title: 'All Permissions',
  description: 'View all permissions available in the system'
})

// Fetch all available permissions using API composable
const api = useApi()
const allPermissionsResponse = ref<{ data: Permission[] }>({ data: [] })
const pending = ref(true)

const fetchPermissions = async () => {
  try {
    pending.value = true
    const response = await api.get<{ data: Permission[] }>('/authorization/permissions')
    allPermissionsResponse.value = response
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    allPermissionsResponse.value = { data: [] }
  } finally {
    pending.value = false
  }
}

await fetchPermissions()

// Computed properties
const allPermissions = computed(() => allPermissionsResponse.value?.data || [])

// Group permissions by resource type
const groupedPermissions = computed(() => {
  const groups = allPermissions.value.reduce((acc, permission) => {
    const resourceType = permission.resource_type || 'other'
    if (!acc[resourceType]) {
      acc[resourceType] = {
        name: resourceType,
        permissions: []
      }
    }

    acc[resourceType].permissions.push({
      ...permission
    })
    return acc
  }, {} as Record<string, { name: string, permissions: Permission[] }>)

  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
})

// Loading state for UI
const isLoading = computed(() => pending.value)

// Resource type display names
const resourceTypeNames: Record<string, string> = {
  customers: 'Customers',
  employees: 'Employees',
  orders: 'Orders',
  plans: 'Plans',
  invoices: 'Invoices',
  payments: 'Payments',
  settings: 'Settings',
  authorization: 'Authorization',
  reports: 'Reports'
}
const getResourceTypeName = (resourceType: string) => {
  return resourceTypeNames[resourceType] || resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <UPageHeader
title="All Permissions" description="All permissions available in the system" variant="naked"
      orientation="horizontal" class="mb-6" />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
    </div>

    <!-- Permissions by Resource Type -->
    <div v-else-if="groupedPermissions.length > 0" class="space-y-8">
      <div v-for="group in groupedPermissions" :key="group.name">
        <!-- Resource Type Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-folder" class="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 class="text-lg uppercase font-semibold text-gray-900 dark:text-gray-100">
              {{ getResourceTypeName(group.name) }}
            </h3>
          </div>

        </div>

        <!-- Permissions List -->
        <ul class="space-y-2">
          <li
v-for="permission in group.permissions" :key="permission.id" variant="ghost"
            class="transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
              p-2 border rounded-md border-gray-200 dark:border-gray-800
            ">
           
              <div class="flex items-center justify-between w-full">
                <div>
                  <p class="font-bold uppercase text-xs">{{ permission.name }}</p>
                  <p class="text-xs text-gray-500">{{ permission.description || `${permission.action} permission for
                    ${group.name}` }}</p>
                </div>


                <div>
                  <UBadge :label="permission.action" color="primary" variant="soft" size="sm" />
                </div>



              </div>
            
          </li>
        </ul>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="groupedPermissions.length === 0" class="flex flex-col items-center justify-center py-12 gap-3">
      <UIcon name="i-lucide-key" class="w-12 h-12 text-gray-400 dark:text-gray-500" />
      <p class="text-lg text-gray-500 dark:text-gray-400">No permissions available</p>
      <p class="text-sm text-gray-400 dark:text-gray-500">Create some permissions first to assign them to roles</p>
    </div>

  </div>
</template>
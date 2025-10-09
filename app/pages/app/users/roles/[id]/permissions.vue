<script setup lang="ts">
import type { Permission, Role } from '~/types'

// Get role ID from route
const route = useRoute()
const roleId = route.params.id as string

// Fetch role details and permissions using API composable
const api = useApi()
const roleResponse = ref<{ data: Role }>({ data: {} as Role })
const allPermissionsResponse = ref<{ data: Permission[] }>({ data: [] })
const rolePermissionsResponse = ref<{ data: Permission[] }>({ data: [] })

const fetchData = async () => {
  try {
    const [roleData, allPermissionsData, rolePermissionsData] = await Promise.all([
      api.get<{ data: Role }>(`/authorization/roles/${roleId}`),
      api.get<{ data: Permission[] }>(`/authorization/permissions`),
      api.get<{ data: Permission[] }>(`/authorization/roles/${roleId}/permissions`)
    ])
    
    roleResponse.value = roleData
    allPermissionsResponse.value = allPermissionsData
    rolePermissionsResponse.value = rolePermissionsData
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}

const refreshRolePermissions = async () => {
  try {
    const data = await api.get<{ data: Permission[] }>(`/authorization/roles/${roleId}/permissions`)
    rolePermissionsResponse.value = data
  } catch (error) {
    console.error('Failed to refresh role permissions:', error)
  }
}

await fetchData()

// Computed properties
const role = computed(() => roleResponse.value?.data || {} as Role)
const rolePermissions = computed(() => rolePermissionsResponse.value?.data || [])
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

    // Check if this permission is assigned to the role
    const isAssigned = rolePermissions.value.some(rp => rp.id === permission.id)

    acc[resourceType].permissions.push({
      ...permission,
      isAssigned
    })
    return acc
  }, {} as Record<string, { name: string, permissions: (Permission & { isAssigned: boolean })[] }>)

  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
})

// State for managing permissions
const isUpdating = ref(false)
const pendingChanges = ref<Record<number, boolean>>({})

// Toggle permission assignment
const togglePermission = (permission: Permission & { isAssigned: boolean }) => {
  // Update the local state immediately for UI feedback
  permission.isAssigned = !permission.isAssigned

  // Check if this matches the original state (role's current permissions)
  const originallyAssigned = rolePermissions.value.some(rp => rp.id === permission.id)

  if (permission.isAssigned === originallyAssigned) {
    // Back to original state, remove from pending changes
    const { [permission.id]: _, ...rest } = pendingChanges.value
    pendingChanges.value = rest
  } else {
    // Different from original state, track the change
    pendingChanges.value[permission.id] = permission.isAssigned
  }
}

// Save all pending changes
const saveChanges = async () => {
  if (Object.keys(pendingChanges.value).length === 0) return

  isUpdating.value = true

  try {
    const api = useApi()

    // Prepare the list of permission IDs that should be assigned to the role
    // Use the current UI state (isAssigned) for all permissions
    const assignedPermissionIds = allPermissions.value
      .filter(permission => {
        // Find the permission in the grouped permissions to get current UI state
        for (const group of groupedPermissions.value) {
          const uiPermission = group.permissions.find(p => p.id === permission.id)
          if (uiPermission) {
            return uiPermission.isAssigned
          }
        }
        return false
      })
      .map(permission => permission.id)

    // Update role permissions
    await api.put(`/authorization/roles/${roleId}/permissions`, {
      permission_ids: assignedPermissionIds
    })

    // Clear pending changes
    pendingChanges.value = {}

    // Refresh role permissions
    await refreshRolePermissions()

    // Show success message
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Role permissions updated successfully'
    })

  } catch (error) {
    console.error('Error updating role permissions:', error)

    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to update role permissions'
    })
  } finally {
    isUpdating.value = false
  }
}

// Check if there are pending changes
const hasPendingChanges = computed(() => Object.keys(pendingChanges.value).length > 0)

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
      :title="`Manage Permissions for ${role.name}`"
      :description="`Assign or revoke permissions for the ${role.name} role. Changes will affect all employees with this role.`" 
      variant="naked"
      orientation="horizontal" 
      class="mb-6" 
    />




    <!-- Permissions by Resource Type -->
    <div class="space-y-8">
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


                    <div class="flex items-center gap-3">
                      <UBadge 
                        :label="permission.action" 
                        color="primary" 
                        variant="soft" 
                        size="sm" 
                      />

                      <USwitch 
                        :model-value="permission.isAssigned" 
                        color="primary"
                        size="md" 
                        @update:model-value="togglePermission(permission)" 
                      />
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

    <!-- Floating save button for pending changes -->
    <div
v-if="hasPendingChanges"
      class="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center gap-4">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">You have unsaved changes</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">{{ Object.keys(pendingChanges).length }} permission(s)
            modified</p>
        </div>
        <div class="flex gap-2">
          <UButton label="Discard" color="neutral" variant="ghost" size="sm" @click="$router.go(0)" />
          <UButton
label="Save Changes" icon="i-lucide-save" color="primary" size="sm" :loading="isUpdating"
            @click="saveChanges" />
        </div>
      </div>
    </div>

  </div>
</template>
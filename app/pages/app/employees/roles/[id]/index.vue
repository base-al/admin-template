<script setup lang="ts">
import type { Role, Permission } from '~/types/authorization'

definePageMeta({
  title: 'Role Details',
  description: 'View role information and permissions'
})

const route = useRoute()
const router = useRouter()
 
const roleId = computed(() => {
  const id = route.params.id as string
  return parseInt(id, 10)
})

// Fetch role data using API composable
const api = useApi()
const roleResponse = ref<{ data: Role } | null>(null)
const permissionsResponse = ref<{ data: Permission[] } | null>(null)
const pending = ref(true)
const permissionsPending = ref(true)

const fetchData = async () => {
  try {
    pending.value = true
    permissionsPending.value = true
    
    const [roleData, permissionsData] = await Promise.all([
      api.get<{ data: Role }>(`/authorization/roles/${roleId.value}`),
      api.get<{ data: Permission[] }>(`/authorization/roles/${roleId.value}/permissions`)
    ])
    
    roleResponse.value = roleData
    permissionsResponse.value = permissionsData
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    pending.value = false
    permissionsPending.value = false
  }
}

await fetchData()

// Computed properties
const role = computed(() => roleResponse.value?.data || null)

const rolePermissions = computed(() => {
  if (!permissionsResponse.value) return []
  return Array.isArray(permissionsResponse.value) ? permissionsResponse.value : permissionsResponse.value.data || []
})


// Actions
const handleDelete = async () => {
  if (!role.value) return
  
  if (role.value.is_system) {
    alert('System roles cannot be deleted')
    return
  }
  
  if (confirm(`Are you sure you want to delete the role "${role.value.name}"?`)) {
    const api = useApi()
    try {
      await api.delete(`/authorization/roles/${role.value.id}`)
      await router.push('/app/employees/roles')
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Group permissions by resource type
const groupedPermissions = computed(() => {
  const groups = rolePermissions.value.reduce((acc: Record<string, Permission[]>, permission: Permission) => {
    const resourceType = permission.resource || permission.resource_type || 'general'
    if (!acc[resourceType]) {
      acc[resourceType] = []
    }
    acc[resourceType].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)
  
  return Object.entries(groups).map(([resourceType, permissions ]) => ({
    resourceType,
    permissions: permissions.sort((a: Permission, b: Permission) => a.action.localeCompare(b.action))
  }))
})
</script>

<template>
  <UDashboardPanel id="role-details">
    <template #header>
      <UDashboardNavbar :title="role?.name || 'Role Details'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="router.push('/app/employees/roles')"
          >
            Back to Roles
          </UButton>
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <CommonPermissionButton
              v-if="role && !role.is_system"
              permission="role:update"
              icon="i-lucide-pencil"
              color="primary"
              @click="router.push(`/app/employees/roles/${role.id}/edit`)"
            >
              Edit
            </CommonPermissionButton>
            <CommonPermissionButton
              v-if="role && !role.is_system"
              permission="role:delete"
              icon="i-lucide-trash-2"
              color="error"
              variant="outline"
              @click="handleDelete"
            >
              Delete
            </CommonPermissionButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="pending" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
      </div>

      <div v-else-if="role" class="max-w-4xl mx-auto space-y-6">
        <!-- Role Header -->
        <UCard>
          <div class="flex items-start gap-6">
            <div class="flex-shrink-0 w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <UIcon name="i-lucide-shield" class="w-8 h-8 text-primary-600" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-2xl font-bold text-gray-900">{{ role.name }}</h1>
                <UBadge
                  :label="role.is_system ? 'System Role' : 'Custom Role'"
                  :color="role.is_system ? 'neutral' : 'primary'"
                  variant="subtle"
                />
              </div>
              <p v-if="role.description" class="text-gray-600">{{ role.description }}</p>
              <p v-else class="text-gray-500">No description provided</p>
              <div class="flex items-center gap-4 mt-4">
                <span class="text-sm text-gray-500">
                  {{ role.permission_count || 0 }} permissions
                </span>
                <span class="text-sm text-gray-500">
                  Created {{ formatDate(role.created_at) }}
                </span>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Role Information -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-primary-500" />
              <h2 class="text-lg font-semibold">Role Information</h2>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role ID</label>
              <p class="text-gray-900">#{{ role.id }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <p class="text-gray-900">{{ role.is_system ? 'System Role' : 'Custom Role' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Created At</label>
              <p class="text-gray-900">{{ formatDate(role.created_at) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
              <p class="text-gray-900">{{ formatDate(role.updated_at) }}</p>
            </div>
          </div>
        </UCard>

        <!-- Permissions -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-key" class="w-5 h-5 text-primary-500" />
              <h2 class="text-lg font-semibold">Permissions</h2>
              <UBadge :label="`${rolePermissions.length} total`" color="info" variant="subtle" />
            </div>
          </template>

          <div v-if="permissionsPending" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
          </div>

          <div v-else-if="groupedPermissions.length > 0" class="space-y-6">
            <div v-for="group in groupedPermissions" :key="group.resourceType" class="space-y-3">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200">
                <UIcon name="i-lucide-folder" class="w-4 h-4 text-gray-500" />
                <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {{ group.resourceType }}
                </h3>
                <UBadge :label="`${group.permissions.length} permissions`" color="neutral" variant="subtle" size="xs" />
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div 
                  v-for="permission in group.permissions" 
                  :key="permission.id"
                  class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <UIcon name="i-lucide-key" class="w-4 h-4 text-blue-500" />
                  <div class="flex-1">
                    <p class="font-medium text-sm text-gray-900">{{ permission.name }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <UBadge :label="permission.action" color="primary" variant="subtle" size="xs" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <UIcon name="i-lucide-key-off" class="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p class="text-gray-600">No permissions assigned to this role</p>
            <CommonPermissionButton
              v-if="!role.is_system"
              permission="permission:assign"
              label="Manage Permissions"
              size="sm"
              class="mt-3"
              @click="navigateTo(`/app/employees/roles/${role.id}/permissions`)"
            />
          </div>
        </UCard>

        <!-- System Role Notice -->
        <UCard v-if="role.is_system" class="border-amber-200 bg-amber-50">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-shield-alert" class="w-5 h-5 text-amber-600 mt-0.5" />
            <div class="text-sm text-amber-800">
              <p class="font-medium mb-1">System Role</p>
              <p>This is a system-defined role that cannot be edited or deleted. Its permissions are managed automatically.</p>
            </div>
          </div>
        </UCard>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-lucide-shield-x" class="w-12 h-12 text-gray-400 mb-4" />
        <h2 class="text-lg font-semibold text-gray-900">Role not found</h2>
        <p class="text-gray-600 mt-1">The role you're looking for doesn't exist.</p>
        <UButton
          label="Back to Roles"
          class="mt-4"
          @click="router.push('/app/employees/roles')"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
<template>
  
  <UDashboardPanel>
   
      
    <template #body>
      <div class="space-y-4">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
          <div>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Role Management
            </h1>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Manage user roles and their permissions
            </p>
          </div>

          <!-- Quick Stats -->
          <div class="flex gap-3">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2 text-center">
              <div class="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {{ roles?.length || 0 }}
              </div>
              <div class="text-xs text-blue-600 dark:text-blue-400">
                Roles
              </div>
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 rounded-md p-2 text-center">
              <div class="text-sm font-semibold text-green-900 dark:text-green-100">
                {{ permissions?.length || 0 }}
              </div>
              <div class="text-xs text-green-600 dark:text-green-400">
                Permissions
              </div>
            </div>
          </div>
        </div>

        <!-- Search and Create -->
        <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div class="flex-1 max-w-sm">
            <UInput
              v-model="searchQuery"
              placeholder="Search roles..."
              icon="i-lucide-search"
              :loading="pending"
              size="sm"
            />
          </div>

          <CommonPermissionButton
            permission="role:create"
            icon="i-lucide-plus"
            @click="handleCreateRole"
          >
            Create Role
          </CommonPermissionButton>
        </div>

        <!-- Roles Table -->
        <UTable
          :data="filteredRoles"
          :columns="columns"
          :loading="pending"
          :empty-state="{
            icon: 'i-lucide-shield',
            label: 'No roles found',
            description: 'Create your first role to get started.'
          }"
        />

      </div>

        <!-- Role Form Modal -->
        <UsersRoleFormModal
          v-model="showRoleModal"
          :mode="roleModalMode"
          :role="selectedRole"
          :loading="submitting"
          @submit="handleRoleSubmit"
        />

        <!-- Delete Confirmation Modal -->
        <CommonConfirmationModal
          v-model="showDeleteConfirm"
          title="Delete Role"
          :message="selectedRole ? `Are you sure you want to delete the role &quot;${selectedRole.name}&quot;?` : 'Are you sure you want to delete this role?'"
          confirm-text="Delete Role"
          confirm-color="error"
          :loading="submitting"
          @confirm="confirmDeleteRole"
        />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Role, Permission } from '~/types'

// Define button props interface
interface ButtonProps {
  variant?: string
  color?: string
  size?: string
  icon?: string
  to?: string
  [key: string]: unknown
}

// Resolve UI components for h() usage
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')
const UButton = resolveComponent('UButton')

// ===== PAGE META =====
definePageMeta({
  title: 'Roles & Permissions',
  description: 'Manage user roles and their permissions'
})

// ===== COMPOSABLES =====
const api = useApi()
const toast = useToast()

// Permission check helper for table actions
const { hasPermission } = useAuthorization()

// Helper function to create permission-controlled buttons in table
const createPermissionButton = (permission: string, buttonProps: ButtonProps, _resourceId?: string) => {
  // Check permission
  const [resource, action] = permission.split(':')
  if (!resource || !action || !hasPermission(resource, action)) {
    return null // Don't render button if no permission
  }
  
  return h(UButton, buttonProps)
}

// ===== SERVER-SIDE DATA FETCHING =====
const rolesData = ref<{ data: Role[] }>({ data: [] })
const permissionsData = ref<{ data: Permission[] }>({ data: [] })
const rolesPending = ref(true)
const permissionsPending = ref(true)

const fetchData = async () => {
  try {
    rolesPending.value = true
    permissionsPending.value = true
    
    const [rolesResponse, permissionsResponse] = await Promise.all([
      api.get<{ data: Role[] }>('/authorization/roles'),
      api.get<{ data: Permission[] }>('/authorization/permissions')
    ])
    
    rolesData.value = rolesResponse
    permissionsData.value = permissionsResponse
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    rolesPending.value = false
    permissionsPending.value = false
  }
}

const refreshRoles = fetchData

await fetchData()

// ===== COMPUTED DATA =====
const roles = computed(() => {
  if (!rolesData.value) return []
  return Array.isArray(rolesData.value) ? rolesData.value : rolesData.value.data || []
})

const permissions = computed(() => {
  if (!permissionsData.value) return []
  return Array.isArray(permissionsData.value) ? permissionsData.value : permissionsData.value.data || []
})

const pending = computed(() => rolesPending.value || permissionsPending.value)

// ===== REACTIVE STATE =====
const searchQuery = ref('')
const showRoleModal = ref(false)
const showDeleteConfirm = ref(false)
const roleModalMode = ref<'create' | 'edit'>('create')
const selectedRole = ref<Role | null>(null)
const submitting = ref(false)


// ===== TABLE CONFIGURATION =====
const columns: TableColumn<Role>[] = [
  {
    accessorKey: 'name',
    header: 'Role Name',
    cell: ({ row }) => {
      const role = row.original
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-gray-900 dark:text-gray-100' }, role.name),
        role.description ? h('span', { class: 'text-sm text-gray-500 dark:text-gray-400' }, role.description) : null
      ])
    }
  },
  {
    accessorKey: 'is_system',
    header: 'Type',
    cell: ({ row }) => {
      const role = row.original
      return role.is_system 
        ? h(UBadge, { label: 'System', color: 'warning', variant: 'soft' })
        : h(UBadge, { label: 'Custom', color: 'success', variant: 'soft' })
    }
  },
  {
    accessorKey: 'permission_count',
    header: 'Permissions',
    cell: ({ row }) => {
      const role = row.original
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UIcon, { name: 'i-lucide-key', class: 'w-4 h-4 text-gray-500' }),
        h('span', {}, role.permission_count || 0)
      ])
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      const role = row.original
      return h('span', { class: 'text-sm' }, new Date(role.created_at).toLocaleDateString())
    }
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const role = row.original
      return h('div', { class: 'flex items-center gap-1' }, [
        createPermissionButton('role:read', {
          icon: 'i-lucide-eye',
          size: 'sm',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => viewRole(role)
        }, role.id.toString()),
        !role.is_system ? createPermissionButton('role:update', {
          icon: 'i-lucide-pencil',
          size: 'sm',
          color: 'primary',
          variant: 'ghost',
          onClick: () => editRole(role)
        }, role.id.toString()) : null,
        createPermissionButton('permission:assign', {
          icon: 'i-lucide-settings',
          size: 'sm',
          color: 'info',
          variant: 'ghost',
          title: 'Manage Permissions',
          onClick: () => managePermissions(role)
        }, role.id.toString()),
        !role.is_system ? createPermissionButton('role:delete', {
          icon: 'i-lucide-trash-2',
          size: 'sm',
          color: 'error',
          variant: 'ghost',
          onClick: () => deleteRole(role)
        }, role.id.toString()) : null
      ].filter(Boolean))
    }
  }
]

// ===== COMPUTED PROPERTIES =====
const filteredRoles = computed(() => {
  let filtered = [...roles.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(role =>
      role.name.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query)
    )
  }

  return filtered
})


// ===== METHODS =====
const handleCreateRole = () => {
  selectedRole.value = null
  roleModalMode.value = 'create'
  showRoleModal.value = true
}

const viewRole = (role: Role) => {
  navigateTo(`/app/users/roles/${role.id}`)
}

const editRole = (role: Role) => {
  selectedRole.value = role
  roleModalMode.value = 'edit'
  showRoleModal.value = true
}

const deleteRole = (role: Role) => {
  selectedRole.value = role
  showDeleteConfirm.value = true
}

const managePermissions = (role: Role) => {
  navigateTo(`/app/users/roles/${role.id}/permissions`)
}

interface RoleFormData {
  name: string
  description?: string
}

const handleRoleSubmit = async (formData: RoleFormData) => {
  submitting.value = true

  try {
    if (roleModalMode.value === 'create') {
      await api.post('/authorization/roles', formData)

      toast.add({
        title: 'Success',
        description: 'Role created successfully'
      })
    } else if (selectedRole.value) {
      await api.put(`/authorization/roles/${selectedRole.value.id}`, formData)

      toast.add({
        title: 'Success',
        description: 'Role updated successfully'
      })
    }

    showRoleModal.value = false
    await refreshRoles()
  } catch (error) {
    console.error('Role operation failed:', error)
    toast.add({
      title: 'Error',
      description: `Failed to ${roleModalMode.value} role`
    })
  } finally {
    submitting.value = false
  }
}

const confirmDeleteRole = async () => {
  if (!selectedRole.value) return

  submitting.value = true

  try {
    await api.delete(`/authorization/roles/${selectedRole.value.id}`)

    showDeleteConfirm.value = false
    await refreshRoles()

    toast.add({
      title: 'Success',
      description: 'Role deleted successfully'
    })
  } catch (error) {
    console.error('Delete failed:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete role'
    })
  } finally {
    submitting.value = false
  }
}
</script>
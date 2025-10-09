<template>
  <div class="role-manager">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Role Management
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage user roles and their permissions
        </p>
      </div>
      
      <UButton
        v-if="canCreateRoles"
        icon="i-lucide-plus"
        @click="showCreateModal = true"
      >
        Create Role
      </UButton>
    </div>

    <!-- Roles Table -->
    <UTable
      :rows="roles"
      :columns="roleColumns"
      :loading="loading"
      :empty-state="{
        icon: 'i-lucide-shield',
        label: 'No roles found',
        description: 'Create your first role to get started.'
      }"
    >
      <!-- Name Column -->
      <template #name-data="{ row }">
        <div class="flex flex-col">
          <span class="font-medium text-gray-900 dark:text-gray-100">
            {{ row.name }}
          </span>
          <span v-if="row.description" class="text-sm text-gray-500 dark:text-gray-400">
            {{ row.description }}
          </span>
        </div>
      </template>

      <!-- System Role Badge -->
      <template #is_system-data="{ row }">
        <UBadge
          v-if="row.is_system"
          label="System"
          color="warning"
          variant="soft"
        />
        <UBadge
          v-else
          label="Custom"
          color="success"
          variant="soft"
        />
      </template>

      <!-- Permission Count -->
      <template #permission_count-data="{ row }">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-key" class="w-4 h-4 text-gray-500" />
          <span>{{ row.permission_count || 0 }}</span>
        </div>
      </template>

      <!-- Created Date -->
      <template #created_at-data="{ row }">
        <span class="text-sm">
          {{ formatDate(row.created_at) }}
        </span>
      </template>

      <!-- Actions Column -->
      <template #actions-data="{ row }">
        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-eye"
            size="sm"
            color="neutral"
            variant="ghost"
            @click="viewRole(row)"
          />
          
          <UButton
            v-if="canEditRole(row)"
            icon="i-lucide-pencil"
            size="sm"
            color="primary"
            variant="ghost"
            @click="editRole(row)"
          />
          
          <UButton
            v-if="canManagePermissions(row)"
            icon="i-lucide-settings"
            size="sm"
            color="info"
            variant="ghost"
            title="Manage Permissions"
            @click="managePermissions(row)"
          />
          
          <UButton
            v-if="canDeleteRole(row)"
            icon="i-lucide-trash-2"
            size="sm"
            color="error"
            variant="ghost"
            @click="deleteRole(row)"
          />
        </div>
      </template>
    </UTable>

    <!-- Create Role Modal -->
    <UModal v-model:open="showCreateModal">
      <template #header>
          <h3 class="text-lg font-semibold">Create New Role</h3>
        </template>
        <template #body>
          <RoleForm
            mode="create"
            :loading="submitLoading"
            @submit="handleCreateRole"
            @cancel="showCreateModal = false"
          />
        </template>
    </UModal>

    <!-- Edit Role Modal -->
    <UModal v-model:open="showEditModal">
      <template #header>
          <h3 class="text-lg font-semibold">Edit Role</h3>
        </template>
        <template #body>
          <RoleForm
            mode="edit"
            :role="selectedRole"
            :loading="submitLoading"
            @submit="handleEditRole"
            @cancel="showEditModal = false"
            @delete="handleDeleteRole"
          />
        </template>
    </UModal>

    <!-- View Role Modal -->
    <UModal v-model:open="showViewModal">
      <template #header>
          <h3 class="text-lg font-semibold">Role Details</h3>
        </template>
        <template #body>
          <RoleDetails
            v-if="selectedRole"
            :role="selectedRole"
            @close="showViewModal = false"
            @edit="editRole"
            @manage-permissions="managePermissions"
          />
        </template>
    </UModal>

    <!-- Permission Management Modal -->
    <UModal v-model:open="showPermissionsModal" :ui="{ width: 'max-w-4xl' }">
      <template #header>
          <h3 class="text-lg font-semibold">
            Manage Permissions - {{ selectedRole?.name }}
          </h3>
        </template>
        <template #body>
          <PermissionManager
            v-if="selectedRole"
            :role="selectedRole"
            :loading="submitLoading"
            @save="handleSavePermissions"
            @cancel="showPermissionsModal = false"
          />
        </template>
    </UModal>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteConfirm"
      title="Delete Role"
      :message="`Are you sure you want to delete the role '${selectedRole?.name}'? This action cannot be undone.`"
      confirm-text="Delete"
      confirm-color="error"
      @confirm="confirmDeleteRole"
    />
  </div>
</template>

<script setup lang="ts">
import type { Role, RoleCreateRequest, RoleUpdateRequest } from '~/types'

// ===== PROPS =====
interface Props {
  roles?: Role[]
  loading?: boolean
  canCreateRoles?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  roles: () => [],
  loading: false,
  canCreateRoles: false
})

// ===== EMITS =====
interface Emits {
  'create-role': [data: RoleCreateRequest]
  'edit-role': [id: number, data: RoleUpdateRequest]
  'delete-role': [id: number]
  'manage-permissions': [roleId: number, permissionIds: number[]]
  'refresh': []
}

const emit = defineEmits<Emits>()

// ===== COMPOSABLES =====
const { formatDate } = useDateFormat()
const authorization = useAuthorization()

// ===== REACTIVE STATE =====
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showPermissionsModal = ref(false)
const showDeleteConfirm = ref(false)
const selectedRole = ref<Role | null>(null)
const submitLoading = ref(false)

// ===== TABLE CONFIGURATION =====
const roleColumns = [
  { key: 'name', label: 'Role Name', sortable: true },
  { key: 'is_system', label: 'Type', sortable: true },
  { key: 'permission_count', label: 'Permissions', sortable: true },
  { key: 'created_at', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
]

// ===== PERMISSION CHECKS =====
const canEditRole = (role: Role): boolean => {
  return !role.is_system && authorization.can('update', 'roles', role.id.toString())
}

const canDeleteRole = (role: Role): boolean => {
  return !role.is_system && authorization.can('delete', 'roles', role.id.toString())
}

const canManagePermissions = (role: Role): boolean => {
  return authorization.can('manage', 'role-permissions', role.id.toString())
}

// ===== ROLE ACTIONS =====
const viewRole = (role: Role) => {
  selectedRole.value = role
  showViewModal.value = true
}

const editRole = (role: Role) => {
  selectedRole.value = role
  showEditModal.value = true
  showViewModal.value = false
}

const deleteRole = (role: Role) => {
  selectedRole.value = role
  showDeleteConfirm.value = true
}

const managePermissions = (role: Role) => {
  selectedRole.value = role
  showPermissionsModal.value = true
  showViewModal.value = false
}

// ===== FORM HANDLERS =====
const handleCreateRole = async (data: RoleCreateRequest) => {
  submitLoading.value = true
  try {
    emit('create-role', data)
    showCreateModal.value = false
  } finally {
    submitLoading.value = false
  }
}

const handleEditRole = async (data: RoleUpdateRequest) => {
  if (!selectedRole.value) return
  
  submitLoading.value = true
  try {
    emit('edit-role', selectedRole.value.id, data)
    showEditModal.value = false
  } finally {
    submitLoading.value = false
  }
}

const handleDeleteRole = () => {
  showEditModal.value = false
  showDeleteConfirm.value = true
}

const confirmDeleteRole = () => {
  if (!selectedRole.value) return
  
  emit('delete-role', selectedRole.value.id)
  showDeleteConfirm.value = false
  selectedRole.value = null
}

const handleSavePermissions = async (permissionIds: number[]) => {
  if (!selectedRole.value) return
  
  submitLoading.value = true
  try {
    emit('manage-permissions', selectedRole.value.id, permissionIds)
    showPermissionsModal.value = false
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.role-manager {
  @apply w-full;
}
</style>
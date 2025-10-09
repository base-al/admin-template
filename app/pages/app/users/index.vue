<template>
  <UDashboardPanel>
    <template #body>
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Manage team members and their access permissions
            </p>
          </div>

          <!-- Quick Stats -->
          <div class="flex gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center min-w-[90px]">
              <div class="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {{ users?.length || 0 }}
              </div>
              <div class="text-xs font-medium text-blue-600 dark:text-blue-400">
                Total Users
              </div>
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center min-w-[90px]">
              <div class="text-2xl font-bold text-green-900 dark:text-green-100">
                {{ roles?.length || 0 }}
              </div>
              <div class="text-xs font-medium text-green-600 dark:text-green-400">
                Active Roles
              </div>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <UCard>
          <BaseTable
            :data="users"
            :columns="columns"
            :loading="loading"
            table-name="Users"
            search-column="first_name"
            search-placeholder="Search users by name, email, or username..."
            :pagination="{
              current_page: pagination.currentPage,
              per_page: pagination.itemsPerPage,
              total: pagination.totalItems
            }"
            :additional-filters="additionalFilters"
            :context-menu-items="getContextMenuItems"
            :on-row-click="handleRowClick"
            @page-change="handlePageChange"
            @per-page-change="handlePerPageChange"
          >
            <!-- Bulk Actions -->
            <template #bulk-actions="{ selectedRows }">
              <CommonPermissionButton
                permission="user:delete"
                icon="i-lucide-trash-2"
                color="error"
                size="sm"
                @click="handleBulkDelete(selectedRows)"
              >
                Delete Selected
              </CommonPermissionButton>
            </template>
          </BaseTable>
        </UCard>

        <!-- User Form Modal -->
        <UsersFormModal
          v-model="showUserModal"
          :mode="userModalMode"
          :user="selectedUser"
          :roles="roles"
          :loading="submitting"
          @submit="handleUserSubmit"
        />

        <!-- Delete Confirmation Modal -->
        <CommonConfirmationModal
          v-model="showDeleteConfirm"
          title="Delete User"
          :message="selectedUser ? `Are you sure you want to delete user &quot;${selectedUser.first_name} ${selectedUser.last_name}&quot;?` : 'Are you sure you want to delete this user?'"
          :details="selectedUser ? `Email: ${selectedUser.email}` : ''"
          confirm-text="Delete User"
          confirm-color="error"
          :loading="submitting"
          @confirm="confirmDeleteUser"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn, ContextMenuItem } from '@nuxt/ui'
import type { User, Role, CreateUserRequest, UpdateUserRequest } from '~/types'

// Resolve UI components for h() usage
const UIcon = resolveComponent('UIcon')
const UBadge = resolveComponent('UBadge')

// ===== COMPOSABLES =====
const toast = useToast()
const usersStore = useUsersStore()
const { formatDate } = useDateFormat()

// ===== SERVER-SIDE DATA FETCHING =====
const api = useApi()
const rolesData = ref<{ data: Role[] }>({ data: [] })
const rolesPending = ref(true)

const fetchRoles = async () => {
  try {
    rolesPending.value = true
    const response = await api.get<{ data: Role[] }>('/authorization/roles')
    rolesData.value = response
  } catch (error) {
    console.error('Failed to fetch roles:', error)
  } finally {
    rolesPending.value = false
  }
}

await fetchRoles()
await usersStore.fetchUsers()

// ===== REACTIVE STATE =====
const showUserModal = ref(false)
const showDeleteConfirm = ref(false)
const userModalMode = ref<'create' | 'edit'>('create')
const selectedUser = ref<User | null>(null)
const submitting = ref(false)
const roleFilter = ref<string>('all')

// ===== COMPUTED DATA =====
const users = computed(() => usersStore.usersWithDisplayName)
const roles = computed(() => {
  if (!rolesData.value) return []
  return Array.isArray(rolesData.value) ? rolesData.value : rolesData.value.data || []
})
const loading = computed(() => usersStore.isLoading || rolesPending.value)
const pagination = computed(() => usersStore.pagination)

// ===== TABLE CONFIGURATION =====
const columns: TableColumn<User>[] = [
  {
    accessorKey: 'first_name',
    header: 'Name',
    cell: ({ row }: { row: { original: User } }) => {
      const user = row.original
      return h('div', { class: 'flex items-center gap-3' }, [
        h('div', { class: 'w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center' }, [
          h(UIcon, { name: 'i-lucide-user', class: 'w-4 h-4 text-primary-600 dark:text-primary-400' })
        ]),
        h('div', {}, [
          h('div', { class: 'font-medium text-gray-900 dark:text-gray-100' }, user.name || `${user.first_name} ${user.last_name}`.trim()),
          h('div', { class: 'text-sm text-gray-500 dark:text-gray-400' }, `@${user.username}`)
        ])
      ])
    }
  },
  {
    accessorKey: 'email',
    header: 'Contact',
    cell: ({ row }: { row: { original: User } }) => {
      const user = row.original
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-sm' }, user.email),
        user.phone ? h('span', { class: 'text-xs text-gray-500 dark:text-gray-400' }, user.phone) : null
      ].filter(Boolean))
    }
  },
  {
    accessorKey: 'role_id',
    header: 'Role',
    cell: ({ row }: { row: { original: User } }) => {
      const user = row.original
      if (user.role) {
        return h(UBadge, {
          class: 'capitalize',
          variant: 'soft',
          color: 'info'
        }, () => user.role!.name)
      }
      return h('span', { class: 'text-sm text-gray-500' }, 'No role')
    }
  },
  {
    accessorKey: 'last_login',
    header: 'Last Login',
    cell: ({ row }: { row: { original: User } }) => {
      const user = row.original
      if (user.last_login) {
        return h('span', { class: 'text-sm' }, formatDate(user.last_login))
      }
      return h('span', { class: 'text-sm text-gray-500' }, 'Never')
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }: { row: { original: User } }) => {
      return h('span', { class: 'text-sm' }, formatDate(row.original.created_at))
    }
  }
]

// ===== FILTERS =====
const roleFilterOptions = computed(() => {
  const uniqueRoles = [...new Map(
    users.value
      .filter(user => user.role)
      .map(user => [user.role_id, user.role!])
  ).values()]

  return [
    { label: 'All Roles', value: 'all' },
    ...uniqueRoles.map(role => ({
      label: role.name,
      value: role.id.toString()
    }))
  ]
})

const additionalFilters = computed(() => [
  {
    key: 'role_id',
    value: roleFilter.value,
    options: roleFilterOptions.value,
    placeholder: 'Filter by role',
    class: 'min-w-40'
  }
])

// ===== CONTEXT MENU & PERMISSIONS =====
const getContextMenuItems = (row: User): ContextMenuItem[] => {
  const items: ContextMenuItem[] = []

  items.push({
    label: 'View Details',
    icon: 'i-lucide-eye',
    click: () => handleView(row)
  })

  items.push({
    label: 'Edit User',
    icon: 'i-lucide-pencil',
    click: () => handleEdit(row)
  })

  items.push({
    label: 'Delete User',
    icon: 'i-lucide-trash-2',
    click: () => handleDelete(row)
  })

  return items
}

// ===== EVENT HANDLERS =====
const handleRowClick = (row: User) => {
  navigateTo(`/app/users/${row.id}`)
}

const handleView = (user: User) => {
  navigateTo(`/app/users/${user.id}`)
}

const handleEdit = (user: User) => {
  selectedUser.value = user
  userModalMode.value = 'edit'
  showUserModal.value = true
}

const handleDelete = (user: User) => {
  selectedUser.value = user
  showDeleteConfirm.value = true
}

const handleBulkDelete = async (selectedRows: Record<string, boolean>) => {
  const selectedIds = Object.keys(selectedRows).map(key => parseInt(key))

  if (selectedIds.length === 0) return

  const confirmed = confirm(`Are you sure you want to delete ${selectedIds.length} user(s)?`)
  if (!confirmed) return

  submitting.value = true
  try {
    await Promise.all(selectedIds.map(id => usersStore.deleteUser(id)))

    toast.add({
      title: 'Success',
      description: `${selectedIds.length} user(s) deleted successfully`
    })

    await usersStore.fetchUsers()
  } catch (error) {
    console.error('Bulk delete failed:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete users'
    })
  } finally {
    submitting.value = false
  }
}

const handlePageChange = (page: number) => {
  usersStore.fetchUsers(page, pagination.value.itemsPerPage)
}

const handlePerPageChange = (perPage: number) => {
  usersStore.fetchUsers(1, perPage)
}

// ===== USER CRUD OPERATIONS =====
interface UserFormData {
  first_name: string
  last_name: string
  username: string
  email: string
  phone?: string
  role_id: number
  password?: string
  changePassword?: boolean
  oldPassword?: string
}

const handleUserSubmit = async (submitData: UserFormData) => {
  submitting.value = true

  try {
    let result

    if (userModalMode.value === 'create') {
      if (!submitData.password) {
        throw new Error('Password is required for new users')
      }

      const createData: CreateUserRequest = {
        first_name: submitData.first_name,
        last_name: submitData.last_name,
        username: submitData.username,
        email: submitData.email,
        phone: submitData.phone,
        role_id: submitData.role_id,
        password: submitData.password
      }

      result = await usersStore.createUser(createData)
    } else if (selectedUser.value) {
      const updateData: UpdateUserRequest = {
        first_name: submitData.first_name,
        last_name: submitData.last_name,
        username: submitData.username,
        email: submitData.email,
        phone: submitData.phone,
        role_id: submitData.role_id
      }

      result = await usersStore.updateUser(selectedUser.value.id, updateData)

      // Handle password change separately if requested
      if (submitData.changePassword && submitData.password && submitData.oldPassword) {
        const passwordResult = await usersStore.changeUserPassword(
          selectedUser.value.id,
          submitData.password,
          submitData.oldPassword
        )

        if (!passwordResult.success) {
          toast.add({
            title: 'Warning',
            description: 'User updated but password change failed: ' + passwordResult.error
          })
        }
      }
    }

    if (result?.success) {
      showUserModal.value = false
      await usersStore.fetchUsers()

      toast.add({
        title: 'Success',
        description: `User ${userModalMode.value === 'create' ? 'created' : 'updated'} successfully`
      })
    } else {
      toast.add({
        title: 'Error',
        description: result?.error || `Failed to ${userModalMode.value} user`
      })
    }
  } catch (error) {
    console.error('User operation failed:', error)
    toast.add({
      title: 'Error',
      description: `Failed to ${userModalMode.value} user`
    })
  } finally {
    submitting.value = false
  }
}

const confirmDeleteUser = async () => {
  if (!selectedUser.value) return

  submitting.value = true

  try {
    const result = await usersStore.deleteUser(selectedUser.value.id)

    if (result.success) {
      showDeleteConfirm.value = false
      await usersStore.fetchUsers()

      toast.add({
        title: 'Success',
        description: 'User deleted successfully'
      })
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to delete user'
      })
    }
  } catch (error) {
    console.error('Delete failed:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete user'
    })
  } finally {
    submitting.value = false
  }
}
</script>

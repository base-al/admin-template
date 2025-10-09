<template>
  <div class="employee-table-container">
    <!-- Search and Filters -->
    <div class="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="flex-1 max-w-sm">
        <UInput 
          v-model="searchQuery"
          placeholder="Search employees..."
          icon="i-lucide-search"
          :loading="loading"
        />
      </div>
      
      <div class="flex gap-2">
        <USelectMenu 
          v-model="roleFilter"
          :options="roleFilterOptions"
          placeholder="Filter by role"
          value-attribute="value"
          option-attribute="label"
          class="w-40"
        />
        
        <CommonPermissionButton
          permission="employee:create"
          icon="i-lucide-plus"
          @click="handleCreateEmployee"
        >
          Add Employee
        </CommonPermissionButton>
      </div>
    </div>

    <!-- Employee Table -->
    <UTable
      :rows="filteredEmployees"
      :columns="tableColumns"
      :loading="loading"
      :empty-state="{
        icon: 'i-lucide-users',
        label: 'No employees found',
        description: 'Get started by adding your first employee.'
      }"
      class="w-full"
    >
      

      <!-- Name Column -->
      <template #name-data="{ row }">
        <div class="flex flex-col">
          <span class="font-medium text-gray-900 dark:text-gray-100">
            {{ (row as unknown as Employee & { name: string }).name || `${(row as unknown as Employee).first_name} ${(row as unknown as Employee).last_name}`.trim() }}
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            @{{ (row as unknown as Employee).username }}
          </span>
        </div>
      </template>

      <!-- Contact Column -->
      <template #contact-data="{ row }">
        <div class="flex flex-col">
          <span class="text-sm">{{ (row as unknown as Employee).email }}</span>
          <span v-if="(row as unknown as Employee).phone" class="text-sm text-gray-500 dark:text-gray-400">
            {{ (row as unknown as Employee).phone }}
          </span>
        </div>
      </template>

      <!-- Role Column -->
      <template #role_name-data="{ row }">
        <UBadge
          v-if="(row as unknown as Employee).role?.name"
          :label="(row as unknown as Employee).role!.name"
          color="info"
          variant="soft"
        />
        <span v-else class="text-gray-500 dark:text-gray-400">
          No role assigned
        </span>
      </template>

      <!-- Last Login Column -->
      <template #last_login-data="{ row }">
        <span v-if="(row as unknown as Employee).last_login" class="text-sm">
          {{ formatDate((row as unknown as Employee).last_login!) }}
        </span>
        <span v-else class="text-sm text-gray-500 dark:text-gray-400">
          Never
        </span>
      </template>

      <!-- Created Date Column -->
      <template #created_at-data="{ row }">
        <span class="text-sm">
          {{ formatDate((row as unknown as Employee).created_at) }}
        </span>
      </template>

      <!-- Actions Column -->
      <template #actions-data="{ row }">
        <div class="flex items-center gap-1">
          <UButton
            v-if="canViewEmployee(row as unknown as Employee)"
            icon="i-lucide-eye"
            size="sm"
            color="neutral"
            variant="ghost"
            @click="handleViewEmployee(row as unknown as Employee)"
          />
          
          <UButton
            v-if="canEditEmployee(row as unknown as Employee)"
            icon="i-lucide-pencil"
            size="sm"
            color="primary"
            variant="ghost"
            @click="handleEditEmployee(row as unknown as Employee)"
          />
          
          <UButton
            v-if="canDeleteEmployee(row as unknown as Employee)"
            icon="i-lucide-trash-2"
            size="sm"
            color="error"
            variant="ghost"
            @click="handleDeleteEmployee(row as unknown as Employee)"
          />
          
          <span 
            v-if="!hasAnyPermission(row as unknown as Employee)"
            class="text-xs text-gray-400"
          >
            No actions available
          </span>
        </div>
      </template>
    </UTable>

    <!-- Pagination -->
    <div v-if="pagination.totalItems > pagination.itemsPerPage" class="mt-4 flex justify-center">
      <UPagination
        :page-count="pagination.totalPages"
        :total="pagination.totalItems"
        :model-value="pagination.currentPage"
        show-last
        show-first
        @update:model-value="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Employee } from '~/types'

// No props needed - component uses store directly

// ===== EMITS =====
interface Emits {
  'create-employee': []
  'view-employee': [employee: Employee]
  'edit-employee': [employee: Employee]
  'delete-employee': [employee: Employee]
  'search': [query: string]
  'filter-role': [roleId: number | null]
  'page-change': [page: number]
}

const emit = defineEmits<Emits>()

// ===== COMPOSABLES =====
const { formatDate } = useDateFormat()
const employeesStore = useUsersStore()
const authorizationStore = useAuthorizationStore()

// ===== REACTIVE STATE =====
const searchQuery = ref('')
const roleFilter = ref<number | null>(null)
const userPermissions = reactive({
  canCreate: false,
  canView: new Map<number, boolean>(),
  canEdit: new Map<number, boolean>(),
  canDelete: new Map<number, boolean>()
})

// ===== TABLE CONFIGURATION =====
const tableColumns: TableColumn<Employee>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'contact', header: 'Contact' },
  { accessorKey: 'role_name', header: 'Role' },
  { accessorKey: 'last_login', header: 'Last Login' },
  { accessorKey: 'created_at', header: 'Created' },
  { accessorKey: 'actions', header: 'Actions' }
]

// ===== COMPUTED PROPERTIES =====
const employees = computed(() => employeesStore.employeesWithDisplayName)
const loading = computed(() => employeesStore.isLoading)
const pagination = computed(() => employeesStore.pagination)

const filteredEmployees = computed(() => {
  let filtered = [...employees.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(emp => 
      emp.name?.toLowerCase().includes(query) ||
      emp.display_name?.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.username.toLowerCase().includes(query) ||
      (emp.role?.name && emp.role.name.toLowerCase().includes(query))
    )
  }

  // Role filter
  if (roleFilter.value !== null) {
    filtered = filtered.filter(emp => emp.role_id === roleFilter.value)
  }

  return filtered
})

const roleFilterOptions = computed(() => {
  const roles = [...new Set(employees.value.map(emp => ({
    id: emp.role_id,
    name: emp.role?.name || 'Unknown Role'
  })).filter(role => role.name !== 'Unknown Role'))]

  return [
    { label: 'All Roles', value: null },
    ...roles.map(role => ({
      label: role.name,
      value: role.id
    }))
  ]
})

// ===== PERMISSION HELPERS =====
const canViewEmployee = (employee: Employee): boolean => {
  return userPermissions.canView.get(employee.id) ?? false
}

const canEditEmployee = (employee: Employee): boolean => {
  return userPermissions.canEdit.get(employee.id) ?? false
}

const canDeleteEmployee = (employee: Employee): boolean => {
  return userPermissions.canDelete.get(employee.id) ?? false
}

const hasAnyPermission = (employee: Employee): boolean => {
  return canViewEmployee(employee) || canEditEmployee(employee) || canDeleteEmployee(employee)
}

// ===== PERMISSION LOADING =====
const loadPermissionsForEmployees = async () => {
  const employeeList = employees.value
  if (employeeList.length === 0) return

  // Load create permission
  userPermissions.canCreate = await authorizationStore.checkPermission('employees', 'create')

  // Load permissions for each employee
  for (const employee of employeeList) {
    const [canView, canEdit, canDelete] = await Promise.all([
      authorizationStore.checkPermission('employees', 'read', employee.id.toString()),
      authorizationStore.checkPermission('employees', 'update', employee.id.toString()),
      authorizationStore.checkPermission('employees', 'delete', employee.id.toString())
    ])

    userPermissions.canView.set(employee.id, canView)
    userPermissions.canEdit.set(employee.id, canEdit)
    userPermissions.canDelete.set(employee.id, canDelete)
  }
}

// ===== EVENT HANDLERS =====
const handleCreateEmployee = () => {
  emit('create-employee')
}

const handleViewEmployee = (employee: Employee) => {
  emit('view-employee', employee)
}

const handleEditEmployee = (employee: Employee) => {
  emit('edit-employee', employee)
}

const handleDeleteEmployee = (employee: Employee) => {
  emit('delete-employee', employee)
}

const handlePageChange = (page: number) => {
  employeesStore.fetchEmployees(page, pagination.value.itemsPerPage, searchQuery.value || '')
}

// ===== WATCHERS =====
let searchTimeout: NodeJS.Timeout | null = null

watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(async () => {
    await employeesStore.searchEmployees(newValue || '')
    await loadPermissionsForEmployees()
  }, 300)
})

watch(employees, loadPermissionsForEmployees, { immediate: true })

// ===== LIFECYCLE =====
onMounted(async () => {
  if (employees.value.length === 0) {
    await employeesStore.fetchEmployees()
  }
  await loadPermissionsForEmployees()
})
</script>

 
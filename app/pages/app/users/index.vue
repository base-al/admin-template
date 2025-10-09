<template>
  <UDashboardPanel>
    <template #body>
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Employees</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Manage your team members and their access permissions
            </p>
          </div>

          <!-- Quick Stats -->
          <div class="flex gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center min-w-[90px]">
              <div class="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {{ employees?.length || 0 }}
              </div>
              <div class="text-xs font-medium text-blue-600 dark:text-blue-400">
                Total Employees
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

        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div class="flex-1 max-w-sm">
            <UInput
              v-model="searchQuery"
              placeholder="Search employees..."
              icon="i-lucide-search"
              :loading="pending"
            />
          </div>

          <div class="flex gap-2">
            <USelect
              v-model="roleFilter"
              :items="roleFilterOptions"
              placeholder="Filter by role"
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


        <!-- Employees Table -->
        <div v-if="!pending && filteredEmployees.length > 0" class="w-full">
          <UTable 
            :data="filteredEmployees"
            :columns="employeeColumns"
            class="w-full"
          />
        </div>

        <!-- Loading State -->
        <div v-else-if="pending" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-12 gap-3">
          <UIcon name="i-lucide-users" class="w-12 h-12 text-gray-400 dark:text-gray-500" />
          <p class="text-lg text-gray-500 dark:text-gray-400">No employees found</p>
          <p class="text-sm text-gray-400 dark:text-gray-500">Get started by adding your first employee.</p>
        </div>

        <!-- Employee Form Modal -->
        <EmployeesFormModal
          v-model="showEmployeeModal"
          :mode="employeeModalMode"
          :employee="selectedEmployee"
          :roles="roles"
          :loading="submitting"
          @submit="handleEmployeeSubmit"
        />

        <!-- Delete Confirmation Modal -->
        <CommonConfirmationModal
          v-model="showDeleteConfirm"
          title="Delete Employee"
          :message="selectedEmployee ? `Are you sure you want to delete employee &quot;${selectedEmployee.first_name} ${selectedEmployee.last_name}&quot;?` : 'Are you sure you want to delete this employee?'"
          :details="selectedEmployee ? `Email: ${selectedEmployee.email}` : ''"
          confirm-text="Delete Employee"
          confirm-color="error"
          :loading="submitting"
          @confirm="confirmDeleteEmployee"
        />
  
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Employee, Role } from '~/types'

// Define table cell context type
interface TableCellContext<T = unknown> {
  row: {
    original: T
  }
}

// Resolve UI components for h() usage
const UIcon = resolveComponent('UIcon')
const UBadge = resolveComponent('UBadge')
const CommonPermissionButton = resolveComponent('CommonPermissionButton')

// ===== COMPOSABLES =====
const toast = useToast()
const employeesStore = useUsersStore()

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

// Load employees from store
await employeesStore.fetchEmployees()

// ===== COMPUTED DATA =====
const employees = computed(() => employeesStore.employees)

const roles = computed(() => {
  if (!rolesData.value) return []
  return Array.isArray(rolesData.value) ? rolesData.value : rolesData.value.data || []
})

const pending = computed(() => employeesStore.isLoading || rolesPending.value)

// ===== TABLE CONFIGURATION =====
const employeeColumns: TableColumn<Employee>[] = [
  {
    accessorKey: 'first_name',
    header: 'Name',
    cell: (ctx: TableCellContext<Employee>) => {
      const employee = ctx.row.original as Employee
      return h('div', { class: 'flex items-center gap-3' }, [
        h('div', { class: 'w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center' }, [
          h(UIcon, { name: 'i-lucide-user', class: 'w-4 h-4 text-primary-600 dark:text-primary-400' })
        ]),
        h('div', {}, [
          h('div', { class: 'font-medium text-gray-900 dark:text-gray-100' }, `${employee.first_name} ${employee.last_name}`),
          h('div', { class: 'text-sm text-gray-500 dark:text-gray-400' }, `@${employee.username}`)
        ])
      ])
    }
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: (ctx: TableCellContext<Employee>) => (ctx.row.original as Employee).phone || '-'
  },
  {
    accessorKey: 'role_id',
    header: 'Role',
    cell: (ctx: TableCellContext<Employee>) => {
      const employee = ctx.row.original as Employee
      if (employee.role) {
        return h(UBadge, { 
          class: 'capitalize', 
          variant: 'subtle', 
          color: 'primary' 
        }, () => employee.role!.name)
      }
      return 'No role assigned'
    }
  },
  {
    accessorKey: 'id',
    header: 'Actions',
    cell: (ctx: TableCellContext<Employee>) => {
      const employee = ctx.row.original as Employee
      return h('div', { class: 'flex items-center gap-1' }, [
        h(CommonPermissionButton, {
          permission: 'employee:read',
          icon: 'i-lucide-eye',
          size: 'xs',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => viewEmployee(employee)
        }),
        h(CommonPermissionButton, {
          permission: 'employee:delete',
          icon: 'i-lucide-trash-2',
          size: 'xs', 
          color: 'error',
          variant: 'ghost',
          onClick: () => deleteEmployee(employee)
        })
      ])
    }
  }
]

// ===== REACTIVE STATE =====
const searchQuery = ref('')
const roleFilter = ref<number | null>(null)
const showEmployeeModal = ref(false)
const showDeleteConfirm = ref(false)
const employeeModalMode = ref<'create' | 'edit'>('create')
const selectedEmployee = ref<Employee | null>(null)
// Removed unused selectedRole variable
const submitting = ref(false)


// ===== COMPUTED PROPERTIES =====
const filteredEmployees = computed(() => {
  let filtered = [...employees.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(emp =>
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.username.toLowerCase().includes(query) ||
      emp.role?.name?.toLowerCase().includes(query)
    )
  }

  // Role filter
  if (roleFilter.value !== null) {
    filtered = filtered.filter(emp => emp.role_id === roleFilter.value)
  }

  return filtered
})

const roleFilterOptions = computed(() => {
  const uniqueRoles = [...new Set(employees.value.map(emp => ({
    id: emp.role_id,
    name: emp.role?.name || 'Unknown Role'
  })).filter(role => role.name !== 'Unknown Role'))]

  return [
    { label: 'All Roles', value: null },
    ...uniqueRoles.map(role => ({
      label: role.name,
      value: role.id
    }))
  ]
})

// Removed unused roleOptions computed property



// ===== METHODS =====
const handleCreateEmployee = () => {
  selectedEmployee.value = null
  employeeModalMode.value = 'create'
  showEmployeeModal.value = true
}

const viewEmployee = (employee: Employee) => {
  navigateTo(`/app/users/${employee.id}`)
}


const deleteEmployee = (employee: Employee) => {
  selectedEmployee.value = employee
  showDeleteConfirm.value = true
}


interface EmployeeFormData {
  first_name: string
  last_name: string
  username: string
  email: string
  phone?: string
  role_id: number
  password?: string
}

const handleEmployeeSubmit = async (submitData: EmployeeFormData & { changePassword?: boolean, oldPassword?: string }) => {
  submitting.value = true

  try {
    let result
    
    if (employeeModalMode.value === 'create') {
      // For create, password is required
      if (!submitData.password) {
        throw new Error('Password is required for new employees')
      }
      const createData = {
        first_name: submitData.first_name,
        last_name: submitData.last_name,
        username: submitData.username,
        email: submitData.email,
        phone: submitData.phone,
        role_id: submitData.role_id,
        password: submitData.password
      }
      result = await employeesStore.createEmployee(createData)
    } else if (selectedEmployee.value) {
      // For update, exclude password from employee update
      const updateData = {
        first_name: submitData.first_name,
        last_name: submitData.last_name,
        username: submitData.username,
        email: submitData.email,
        phone: submitData.phone,
        role_id: submitData.role_id
      }
      result = await employeesStore.updateEmployee(selectedEmployee.value.id, updateData)
      
      // Handle password change separately if requested
      if (submitData.changePassword && submitData.password && submitData.oldPassword) {
        const passwordResult = await employeesStore.changeEmployeePassword(
          selectedEmployee.value.id,
          submitData.password,
          submitData.oldPassword
        )
        
        if (!passwordResult.success) {
          toast.add({
            title: 'Warning',
            description: 'Employee updated but password change failed: ' + passwordResult.error
          })
        }
      }
    }

    if (result?.success) {
      showEmployeeModal.value = false

      // Refresh employees list
      await employeesStore.fetchEmployees()

      toast.add({
        title: 'Success',
        description: `Employee ${employeeModalMode.value === 'create' ? 'created' : 'updated'} successfully`
      })
    } else {
      toast.add({
        title: 'Error',
        description: result?.error || `Failed to ${employeeModalMode.value} employee`
      })
    }
  } catch (error) {
    console.error('Employee operation failed:', error)
    toast.add({
      title: 'Error',
      description: `Failed to ${employeeModalMode.value} employee`
    })
  } finally {
    submitting.value = false
  }
}

const confirmDeleteEmployee = async () => {
  if (!selectedEmployee.value) return

  submitting.value = true

  try {
    const result = await employeesStore.deleteEmployee(selectedEmployee.value.id)

    if (result.success) {
      showDeleteConfirm.value = false

      // Refresh employees list
      await employeesStore.fetchEmployees()

      toast.add({
        title: 'Success',
        description: 'Employee deleted successfully'
      })
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to delete employee'
      })
    }
  } catch (error) {
    console.error('Delete failed:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete employee'
    })
  } finally {
    submitting.value = false
  }
}
</script>
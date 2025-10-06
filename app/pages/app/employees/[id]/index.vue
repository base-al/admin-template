<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Employee, UpdateEmployeeRequest } from '~/types/employee'

definePageMeta({
  title: 'Employee Details',
  description: 'View and edit employee information and permissions'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const employeesStore = useEmployeesStore()
const { roleOptions, initialize } = useAuthorization()

const employeeId = computed(() => parseInt(route.params.id as string))

// Initialize authorization store to load roles
await initialize()

// Fetch employee data using our API composable
const api = useApi()
const employeeResponse = ref<{ data: Employee } | null>(null)
const pending = ref(true)

const fetchEmployee = async () => {
  try {
    pending.value = true
    const response = await api.get<{ data: Employee }>(`/employees/${employeeId.value}`)
    employeeResponse.value = response
  } catch (error) {
    console.error('Failed to fetch employee:', error)
    employeeResponse.value = null
  } finally {
    pending.value = false
  }
}

const refresh = fetchEmployee

// Initial fetch
await fetchEmployee()

const employee = computed(() => {
  if (!employeeResponse.value) return null
  return Array.isArray(employeeResponse.value) ? employeeResponse.value[0] : employeeResponse.value.data || employeeResponse.value
})


// Form validation schemas for each section
const personalSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long'),
  email: z.string().email('Invalid email address').max(100, 'Email too long'),
  phone: z.string().optional()
})

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(50, 'Password too long'),
  confirm_password: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
})

const roleSchema = z.object({
  role_id: z.number().min(1, 'Please select a role')
})

type PersonalSchema = z.output<typeof personalSchema>
type PasswordSchema = z.output<typeof passwordSchema>
type RoleSchema = z.output<typeof roleSchema>

// Form state
const personalState = reactive<Partial<PersonalSchema>>({
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone: ''
})

const passwordState = reactive<Partial<PasswordSchema>>({
  password: '',
  confirm_password: ''
})

const roleState = reactive<Partial<RoleSchema>>({
  role_id: undefined
})

const isSubmittingPersonal = ref(false)
const isSubmittingPassword = ref(false)
const isSubmittingRole = ref(false)
const editingSection = ref<'personal' | 'password' | 'role' | null>(null)

// Watch for employee data and populate forms
watch(employee, (newEmployee) => {
  if (newEmployee) {
    personalState.first_name = newEmployee.first_name
    personalState.last_name = newEmployee.last_name
    personalState.username = newEmployee.username
    personalState.email = newEmployee.email
    personalState.phone = newEmployee.phone || ''
    
    passwordState.password = ''
    
    roleState.role_id = newEmployee.role_id
  }
}, { immediate: true })

const fullName = computed(() => {
  if (!employee.value) return ''
  return `${employee.value.first_name} ${employee.value.last_name}`.trim()
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Section-specific form submissions
async function updatePersonalInfo(event: FormSubmitEvent<PersonalSchema>) {
  if (!employee.value) return
  
  console.log('Personal form submitted:', event.data)
  
  isSubmittingPersonal.value = true
  
  try {
    console.log('Sending personal update:', event.data)
    
    const result = await employeesStore.updateEmployee(employee.value.id, event.data as UpdateEmployeeRequest)
    
    if (result.success) {
      toast.add({
        title: 'Success',
        description: 'Personal information updated successfully',
        color: 'success'
      })
      editingSection.value = null
      await refresh()
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to update personal information',
        color: 'error'
      })
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: (error as Error).message || 'Failed to update personal information',
      color: 'error'
    })
  } finally {
    isSubmittingPersonal.value = false
  }
}

async function updatePassword(event: FormSubmitEvent<PasswordSchema>) {
  if (!employee.value) return
  
  console.log('Password form submitted:', event.data)
  
  isSubmittingPassword.value = true
  
  try {
    // Use the dedicated password change method
    const result = await employeesStore.changeEmployeePassword(
      employee.value.id,
      event.data.password,
      '' // No current password required in this context - admin changing password
    )
    
    if (result.success) {
      toast.add({
        title: 'Success',
        description: 'Password updated successfully',
        color: 'success'
      })
      editingSection.value = null
      passwordState.password = ''
      passwordState.confirm_password = ''
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to update password',
        color: 'error'
      })
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to update password',
      color: 'error'
    })
  } finally {
    isSubmittingPassword.value = false
  }
}

async function updateRole(event: FormSubmitEvent<RoleSchema>) {
  if (!employee.value) return
  
  isSubmittingRole.value = true
  
  try {
    const result = await employeesStore.updateEmployee(employee.value.id, event.data as UpdateEmployeeRequest)
    
    if (result.success) {
      toast.add({
        title: 'Success',
        description: 'Role updated successfully',
        color: 'success'
      })
      editingSection.value = null
      await refresh()
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to update role',
        color: 'error'
      })
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to update role',
      color: 'error'
    })
  } finally {
    isSubmittingRole.value = false
  }
}

const startEditing = (section: 'personal' | 'password' | 'role') => {
  editingSection.value = section
}

const cancelEditing = () => {
  editingSection.value = null
  // Reset form states to original values
  if (employee.value) {
    personalState.first_name = employee.value.first_name
    personalState.last_name = employee.value.last_name
    personalState.username = employee.value.username
    personalState.email = employee.value.email
    personalState.phone = employee.value.phone || ''
    
    passwordState.password = ''
    passwordState.confirm_password = ''
    
    roleState.role_id = employee.value.role_id
  }
}

// Actions
const handleDelete = async () => {
  if (!employee.value) return
  
  if (confirm(`Are you sure you want to delete ${employee.value.first_name} ${employee.value.last_name}?`)) {
    const result = await employeesStore.deleteEmployee(employee.value.id)
    if (result.success) {
      await router.push('/app/employees')
    }
  }
}
</script>

<template>
  <UDashboardPanel id="employee-details">
    <template #header>
      <UDashboardNavbar :title="fullName || 'Employee Details'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="router.push('/app/employees')"
          >
            Back to Employees
          </UButton>
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <CommonPermissionButton
              v-if="employee"
              permission="employee:delete"
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

      <div v-else-if="employee">
        <!-- Employee Header -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-user" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div class="flex-1 min-w-0">
              <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{{ fullName }}</h1>
              <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">{{ employee.email }}</p>
              <div class="flex flex-wrap items-center gap-4">
                <UBadge
                  :label="employee.role?.name || 'No Role'"
                  :color="employee.role?.name ? 'primary' : 'neutral'"
                  variant="subtle"
                  size="lg"
                />
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  Joined {{ formatDate(employee.created_at) }}
                </span>
              </div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <!-- Personal Information -->
          <div class="xl:col-span-2 space-y-4">
            <div class="border rounded-md border-gray-200 dark:border-gray-700 p-3">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user" class="w-4 h-4 text-primary-500 dark:text-primary-400" />
                  <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase">Personal Information</h2>
                </div>
                <CommonPermissionButton
                  v-if="editingSection !== 'personal'"
                  permission="employee:update"
                  icon="i-lucide-pencil"
                  color="primary"
                  variant="outline"
                  size="sm"
                  @click="startEditing('personal')"
                >
                  Edit
                </CommonPermissionButton>
              </div>

              <!-- View Mode -->
              <div v-if="editingSection !== 'personal'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                  <p class="text-gray-900 dark:text-gray-100 text-lg">#{{ employee.id }}</p>
                </div>
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                  <p class="text-gray-900 dark:text-gray-100 text-lg font-mono">{{ employee.username }}</p>
                </div>
              
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <p class="text-gray-900 dark:text-gray-100 text-lg">{{ employee.first_name }}</p>
                </div>
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <p class="text-gray-900 dark:text-gray-100 text-lg">{{ employee.last_name }}</p>
                </div>
               
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <p class="text-gray-900 dark:text-gray-100 text-lg">{{ employee.email }}</p>
                </div>
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                  <p class="text-gray-900 dark:text-gray-100 text-lg">{{ employee.phone || 'Not provided' }}</p>
                </div>
              </div>

              <!-- Edit Mode -->
              <UForm
                v-else
                :schema="personalSchema"
                :state="personalState"
                class="space-y-4"
                @submit="updatePersonalInfo"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UFormField label="First Name" name="first_name" required>
                    <UInput
                      v-model="personalState.first_name"
                      placeholder="John"
                      icon="i-lucide-user"
                    />
                  </UFormField>
                  <UFormField label="Last Name" name="last_name" required>
                    <UInput
                      v-model="personalState.last_name"
                      placeholder="Doe"
                    />
                  </UFormField>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UFormField label="Username" name="username" required>
                    <UInput
                      v-model="personalState.username"
                      placeholder="johndoe"
                      icon="i-lucide-at-sign"
                    />
                  </UFormField>
                  <UFormField label="Email Address" name="email" required>
                    <UInput
                      v-model="personalState.email"
                      type="email"
                      placeholder="john@company.com"
                      icon="i-lucide-mail"
                    />
                  </UFormField>
                </div>
                <UFormField label="Phone Number" name="phone" optional>
                  <UInput
                    v-model="personalState.phone"
                    placeholder="+383 44 123 456"
                    icon="i-lucide-phone"
                  />
                </UFormField>
                <div class="flex justify-end gap-2 pt-4">
                  <UButton
                    label="Cancel"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :disabled="isSubmittingPersonal"
                    @click="cancelEditing"
                  />
                  <UButton
                    type="submit"
                    label="Save Changes"
                    icon="i-lucide-save"
                    color="primary"
                    size="sm"
                    :loading="isSubmittingPersonal"
                  />
                </div>
              </UForm>
            </div>

            <!-- Password -->
            <div class="border rounded-md border-gray-200 dark:border-gray-700 p-3">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-lock" class="w-4 h-4 text-primary-500 dark:text-primary-400" />
                  <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase">Password</h2>
                </div>
                <CommonPermissionButton
                  v-if="editingSection !== 'password'"
                  permission="employee:update"
                  icon="i-lucide-pencil"
                  color="primary"
                  variant="outline"
                  size="sm"
                  @click="startEditing('password')"
                >
                  Change Password
                </CommonPermissionButton>
              </div>

              <!-- View Mode -->
              <div v-if="editingSection !== 'password'" class="space-y-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-green-500" />
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Password is set</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Last updated: {{ formatDate(employee.updated_at) }}</p>
                </div>
              </div>

              <!-- Edit Mode -->
              <UForm
                v-else
                :schema="passwordSchema"
                :state="passwordState"
                class="space-y-4"
                @submit="updatePassword"
              >
                <UFormField label="New Password" name="password" required>
                  <UInput
                    v-model="passwordState.password"
                    type="password"
                    placeholder="Enter new password"
                    icon="i-lucide-lock"
                  />
                  <template #help>
                    <p class="text-xs text-gray-500">Must be at least 8 characters long</p>
                  </template>
                </UFormField>
                <UFormField label="Confirm Password" name="confirm_password" required>
                  <UInput
                    v-model="passwordState.confirm_password"
                    type="password"
                    placeholder="Confirm new password"
                    icon="i-lucide-lock"
                  />
                  <template #help>
                    <p class="text-xs text-gray-500">Re-enter the same password to confirm</p>
                  </template>
                </UFormField>
                <div class="flex justify-end gap-2 pt-4">
                  <UButton
                    label="Cancel"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :disabled="isSubmittingPassword"
                    @click="cancelEditing"
                  />
                  <UButton
                    type="submit"
                    label="Update Password"
                    icon="i-lucide-save"
                    color="primary"
                    size="sm"
                    :loading="isSubmittingPassword"
                  />
                </div>
              </UForm>
            </div>
          </div>

          <!-- Role & Permissions Sidebar -->
          <div class="xl:col-span-1">
            <div class="border rounded-md border-gray-200 dark:border-gray-700 p-3">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-shield" class="w-4 h-4 text-primary-500 dark:text-primary-400" />
                  <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase">Role & Permissions</h2>
                </div>
                <CommonPermissionButton
                  v-if="editingSection !== 'role'"
                  permission="employee:update"
                  icon="i-lucide-pencil"
                  color="primary"
                  variant="outline"
                  size="sm"
                  @click="startEditing('role')"
                >
                  Edit
                </CommonPermissionButton>
              </div>

              <!-- View Mode -->
              <div v-if="editingSection !== 'role'" class="space-y-6">
                <div class="space-y-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Role</label>
                  <UBadge
                    :label="employee.role?.name || 'No Role Assigned'"
                    :color="employee.role?.name ? 'primary' : 'neutral'"
                    variant="subtle"
                    size="lg"
                    class="w-full justify-center"
                  />
                </div>
                
                <div v-if="employee.role" class="space-y-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <p class="text-gray-900 dark:text-gray-100">{{ employee.role.description || 'No description available' }}</p>
                </div>
                
                <div v-if="employee.role" class="space-y-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-key" class="w-4 h-4 text-gray-400" />
                    <span class="text-gray-900 dark:text-gray-100 font-semibold">{{ employee.role.permission_count || 0 }}</span>
                    <span class="text-gray-600 dark:text-gray-400">permissions assigned</span>
                  </div>
                </div>

                <div v-if="employee.role" class="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <CommonPermissionButton
                    permission="permission:assign"
                    icon="i-lucide-settings"
                    color="primary"
                    variant="outline"
                    size="sm"
                    class="w-full"
                    @click="$router.push(`/app/employees/roles/${employee.role.id}/permissions`)"
                  >
                    Manage Role Permissions
                  </CommonPermissionButton>
                </div>
              </div>

              <!-- Edit Mode -->
              <UForm
                v-else
                :schema="roleSchema"
                :state="roleState"
                class="space-y-4"
                @submit="updateRole"
              >
                <UFormField label="Role" name="role_id" required>
                  <USelect
                    v-model="roleState.role_id"
                    :items="roleOptions"
                    placeholder="Select a role"
                    icon="i-lucide-shield"
                    value-attribute="id"
                    option-attribute="name"
                  />
                </UFormField>
                <div class="flex justify-end gap-2 pt-4">
                  <UButton
                    label="Cancel"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :disabled="isSubmittingRole"
                    @click="cancelEditing"
                  />
                  <UButton
                    type="submit"
                    label="Save Changes"
                    icon="i-lucide-save"
                    color="primary"
                    size="sm"
                    :loading="isSubmittingRole"
                  />
                </div>
              </UForm>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-lucide-user-x" class="w-12 h-12 text-gray-400 mb-4" />
        <h2 class="text-lg font-semibold text-gray-900">Employee not found</h2>
        <p class="text-gray-600 mt-1">The employee you're looking for doesn't exist.</p>
        <UButton
          label="Back to Employees"
          class="mt-4"
          @click="router.push('/app/employees')"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
<script setup lang="ts">
import type { Employee, Role } from '~/types'

interface Props {
  modelValue: boolean
  mode: 'create' | 'edit'
  employee?: Employee | null
  roles: Role[]
  loading?: boolean
}

interface EmployeeFormData {
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

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: EmployeeFormData): void
}

const props = withDefaults(defineProps<Props>(), {
  employee: null,
  loading: false
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const showPasswordFields = ref(false)

const formState = reactive({
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone: '',
  role_id: undefined as number | undefined,
  password: '',
  password_confirmation: '',
  old_password: ''
})

const roleOptions = computed(() => {
  return props.roles.map(role => ({
    label: role.name,
    value: role.id
  }))
})

const resetForm = () => {
  Object.assign(formState, {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    role_id: undefined,
    password: '',
    password_confirmation: '',
    old_password: ''
  })
  showPasswordFields.value = false
}

const populateForm = (employee: Employee) => {
  Object.assign(formState, {
    first_name: employee.first_name,
    last_name: employee.last_name,
    username: employee.username,
    email: employee.email,
    phone: employee.phone || '',
    role_id: employee.role_id,
    password: '',
    password_confirmation: '',
    old_password: ''
  })
  showPasswordFields.value = false
}

const handleSubmit = () => {
  const submitData = {
    first_name: formState.first_name,
    last_name: formState.last_name,
    username: formState.username,
    email: formState.email,
    phone: formState.phone || undefined,
    role_id: formState.role_id!,
    ...(props.mode === 'create' || showPasswordFields.value ? {
      password: formState.password,
      changePassword: showPasswordFields.value,
      oldPassword: formState.old_password
    } : {})
  }

  emit('submit', submitData)
}

// Watch for mode and employee changes
watch(() => props.mode, (newMode) => {
  if (newMode === 'create') {
    resetForm()
  }
})

watch(() => props.employee, (newEmployee) => {
  if (newEmployee && props.mode === 'edit') {
    populateForm(newEmployee)
  }
}, { immediate: true })

// Reset form when modal opens in create mode
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.mode === 'create') {
    resetForm()
  }
})
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ mode === 'create' ? 'Create Employee' : 'Edit Employee' }}
      </h3>
    </template>

    <template #body>
      <UForm
          :state="formState"
          class="space-y-6"
          @submit="handleSubmit"
        >
          <!-- Employee Details -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <UFormField label="First Name" name="first_name" required>
              <UInput
                v-model="formState.first_name"
                placeholder="John"
              />
            </UFormField>

            <UFormField label="Last Name" name="last_name" required>
              <UInput
                v-model="formState.last_name"
                placeholder="Doe"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <UFormField label="Username" name="username" required>
              <UInput
                v-model="formState.username"
                placeholder="john.doe"
              />
            </UFormField>

            <UFormField label="Email" name="email" required>
              <UInput
                v-model="formState.email"
                type="email"
                placeholder="john.doe@company.com"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <UFormField label="Phone" name="phone">
              <UInput
                v-model="formState.phone"
                placeholder="+1 (555) 123-4567"
              />
            </UFormField>

            <UFormField label="Role" name="role_id" required>
              <USelect
                v-model="formState.role_id"
                :items="roleOptions"
                placeholder="Select a role"
              />
            </UFormField>
          </div>

          <!-- Password Fields -->
          <div v-if="mode === 'create' || showPasswordFields">
            <div v-if="mode === 'edit'" class="flex items-center justify-between mb-4">
              <h4 class="text-md font-medium">Change Password</h4>
              <UButton
                v-if="showPasswordFields"
                variant="ghost"
                size="sm"
                @click="showPasswordFields = false"
              >
                Cancel
              </UButton>
            </div>

            <!-- Old Password Field (only for edit mode) -->
            <div v-if="mode === 'edit' && showPasswordFields" class="mb-6">
              <UFormField label="Current Password" name="old_password" required>
                <UInput
                  v-model="formState.old_password"
                  type="password"
                  placeholder="Enter current password"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <UFormField label="Password" name="password" :required="mode === 'create'">
                <UInput
                  v-model="formState.password"
                  type="password"
                  placeholder="Enter password"
                />
              </UFormField>

              <UFormField label="Confirm Password" name="password_confirmation" :required="mode === 'create'">
                <UInput
                  v-model="formState.password_confirmation"
                  type="password"
                  placeholder="Confirm password"
                />
              </UFormField>
            </div>
          </div>

          <!-- Show Password Fields Button -->
          <div v-else-if="mode === 'edit'" class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <UButton
              variant="outline"
              icon="i-lucide-key"
              @click="showPasswordFields = true"
            >
              Change Password
            </UButton>
          </div>

          <!-- Form Actions -->
          <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <UButton
              type="submit"
              :loading="loading"
            >
              {{ mode === 'create' ? 'Create Employee' : 'Update Employee' }}
            </UButton>

            <UButton
              variant="outline"
              :disabled="loading"
              @click="isOpen = false"
            >
              Cancel
            </UButton>
          </div>
      </UForm>
    </template>
  </UModal>
</template>
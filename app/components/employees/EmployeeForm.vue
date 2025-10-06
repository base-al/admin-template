<template>
  <UForm
    ref="form"
    :schema="validationSchema"
    :state="formData"
    class="space-y-6"
    @submit="handleSubmit"
  >
    <!-- Personal Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="First Name" name="first_name" required>
        <UInput
          v-model="formData.first_name"
          placeholder="John"
          :disabled="loading"
        />
      </UFormField>

      <UFormField label="Last Name" name="last_name" required>
        <UInput
          v-model="formData.last_name"
          placeholder="Doe"
          :disabled="loading"
        />
      </UFormField>
    </div>

    <!-- Account Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="Username" name="username" required>
        <UInput
          v-model="formData.username"
          placeholder="john.doe"
          :disabled="loading"
        />
      </UFormField>

      <UFormField label="Email" name="email" required>
        <UInput
          v-model="formData.email"
          type="email"
          placeholder="john.doe@company.com"
          :disabled="loading"
        />
      </UFormField>
    </div>

    <!-- Contact & Role -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="Phone" name="phone">
        <UInput
          v-model="formData.phone"
          type="tel"
          placeholder="+383 44 123 456"
          :disabled="loading"
        />
      </UFormField>

      <UFormField label="Role" name="role_id" required>
        <USelectMenu
          v-model="formData.role_id"
          :options="roleOptions"
          placeholder="Select a role"
          value-attribute="value"
          option-attribute="label"
          :disabled="loading || roleOptions.length === 0"
        />
      </UFormField>
    </div>

    <!-- Password Fields (for create mode or password change) -->
    <div v-if="mode === 'create' || showPasswordFields" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField 
        :label="mode === 'create' ? 'Password' : 'New Password'" 
        name="password" 
        :required="mode === 'create'"
      >
        <UInput
          v-model="formData.password"
          type="password"
          placeholder="••••••••"
          :disabled="loading"
        />
      </UFormField>

      <UFormField 
        :label="mode === 'create' ? 'Confirm Password' : 'Confirm New Password'" 
        name="password_confirmation"
        :required="mode === 'create'"
      >
        <UInput
          v-model="formData.password_confirmation"
          type="password"
          placeholder="••••••••"
          :disabled="loading"
        />
      </UFormField>
    </div>

    <!-- Password Change Toggle (for edit mode) -->
    <div v-if="mode === 'edit'" class="flex items-center space-x-3">
      <UCheckbox 
        v-model="showPasswordFields"
        :disabled="loading"
      />
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Change password
      </label>
    </div>

    <!-- Avatar Upload (if supported) -->
    <div v-if="enableAvatarUpload" class="space-y-2">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Profile Picture
      </label>
      <div class="flex items-center space-x-4">
        <UAvatar
          :src="formData.avatar_url || employee?.avatar_url"
          :alt="formData.first_name"
          size="lg"
        />
        <UButton
          variant="outline"
          :disabled="loading"
          @click="handleAvatarUpload"
        >
          Change Photo
        </UButton>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <UButton
        type="submit"
        :loading="loading"
        :disabled="!isFormValid"
        class="justify-center"
      >
        <template v-if="mode === 'create'">
          Create Employee
        </template>
        <template v-else>
          Update Employee
        </template>
      </UButton>

      <UButton
        variant="outline"
        :disabled="loading"
        class="justify-center"
        @click="handleCancel"
      >
        Cancel
      </UButton>

      <div class="flex-1" />

      <UButton
        v-if="mode === 'edit' && employee && canDeleteEmployee"
        color="error"
        variant="outline"
        :disabled="loading"
        @click="handleDelete"
      >
        Delete Employee
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, Role } from '~/types'

// ===== PROPS =====
interface Props {
  mode: 'create' | 'edit'
  employee?: Employee | null
  roles?: Role[]
  loading?: boolean
  enableAvatarUpload?: boolean
  canDeleteEmployee?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  employee: null,
  roles: () => [],
  loading: false,
  enableAvatarUpload: false,
  canDeleteEmployee: false
})

// ===== EMITS =====
interface Emits {
  'submit': [data: CreateEmployeeRequest | UpdateEmployeeRequest]
  'cancel': []
  'delete': [employee: Employee]
  'avatar-upload': [file: File]
}

const emit = defineEmits<Emits>()

// ===== REACTIVE STATE =====
const showPasswordFields = ref(false)
const form = ref()

interface FormData {
  first_name: string
  last_name: string
  username: string
  email: string
  phone: string
  role_id: number | null
  password: string
  password_confirmation: string
  avatar_url?: string
}

const formData = reactive<FormData>({
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone: '',
  role_id: null,
  password: '',
  password_confirmation: '',
  avatar_url: ''
})

// ===== VALIDATION SCHEMA =====
const validationSchema = computed(() => {
  const baseSchema = {
    first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    role_id: z.number().min(1, 'Role is required'),
    avatar_url: z.string().url().optional().or(z.literal(''))
  }

  // Password validation for create mode or when changing password
  if (props.mode === 'create' || showPasswordFields.value) {
    return z.object({
      ...baseSchema,
      password: z.string().min(8, 'Password must be at least 8 characters'),
      password_confirmation: z.string()
    }).refine(data => data.password === data.password_confirmation, {
      message: 'Passwords do not match',
      path: ['password_confirmation']
    })
  }

  return z.object({
    ...baseSchema,
    password: z.string().optional(),
    password_confirmation: z.string().optional()
  })
})

// ===== COMPUTED PROPERTIES =====
const roleOptions = computed(() => {
  return props.roles.map(role => ({
    label: role.name,
    value: role.id,
    description: role.description
  }))
})

const isFormValid = computed(() => {
  try {
    validationSchema.value.parse(formData)
    return true
  } catch {
    return false
  }
})

// ===== METHODS =====
const populateForm = () => {
  if (props.employee && props.mode === 'edit') {
    formData.first_name = props.employee.first_name
    formData.last_name = props.employee.last_name
    formData.username = props.employee.username
    formData.email = props.employee.email
    formData.phone = props.employee.phone || ''
    formData.role_id = props.employee.role_id
    formData.avatar_url = props.employee.avatar_url || ''
    // Don't populate password fields in edit mode
    formData.password = ''
    formData.password_confirmation = ''
  }
}

const resetForm = () => {
  Object.assign(formData, {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    role_id: null,
    password: '',
    password_confirmation: '',
    avatar_url: ''
  })
  showPasswordFields.value = false
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  const submitData: CreateEmployeeRequest | UpdateEmployeeRequest = {
    first_name: formData.first_name,
    last_name: formData.last_name,
    username: formData.username,
    email: formData.email,
    phone: formData.phone || undefined,
    role_id: formData.role_id!
  }

  // Include password only if it's create mode or password is being changed
  if (props.mode === 'create' || (showPasswordFields.value && formData.password)) {
    (submitData as CreateEmployeeRequest).password = formData.password
  }

  emit('submit', submitData)
}

const handleCancel = () => {
  if (props.mode === 'create') {
    resetForm()
  } else {
    populateForm()
    showPasswordFields.value = false
  }
  emit('cancel')
}

const handleDelete = () => {
  if (props.employee) {
    emit('delete', props.employee)
  }
}

const handleAvatarUpload = () => {
  // Create a file input element
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      emit('avatar-upload', file)
    }
  }
  
  input.click()
}

// ===== WATCHERS =====
watch(() => props.employee, populateForm, { immediate: true })
watch(() => props.mode, () => {
  if (props.mode === 'create') {
    resetForm()
  } else {
    populateForm()
  }
})

// ===== LIFECYCLE =====
onMounted(() => {
  populateForm()
})
</script>
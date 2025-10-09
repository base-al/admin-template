<template>
  <UForm
    ref="form"
    :schema="validationSchema"
    :state="formData"
    class="space-y-6"
    @submit="handleSubmit"
  >
    <!-- Role Name -->
    <UFormGroup label="Role Name" name="name" required>
      <UInput
        v-model="formData.name"
        placeholder="Administrator, Manager, Editor..."
        :disabled="loading"
      />
    </UFormGroup>

    <!-- Description -->
    <UFormGroup label="Description" name="description">
      <UTextarea
        v-model="formData.description"
        placeholder="Describe the role's responsibilities and access level..."
        :disabled="loading"
        :rows="3"
      />
    </UFormGroup>

    <!-- System Role Badge (for edit mode) -->
    <div v-if="mode === 'edit' && role?.is_system" class="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      <div>
        <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">System Role</p>
        <p class="text-xs text-yellow-600 dark:text-yellow-400">This is a system role and cannot be deleted. Some properties may be restricted.</p>
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
          Create Role
        </template>
        <template v-else>
          Update Role
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
        v-if="mode === 'edit' && role && !role.is_system && canDeleteRole"
        color="error"
        variant="outline"
        :disabled="loading"
        @click="handleDelete"
      >
        Delete Role
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { Role, RoleCreateRequest, RoleUpdateRequest } from '~/types'

// ===== PROPS =====
interface Props {
  mode: 'create' | 'edit'
  role?: Role | null
  loading?: boolean
  canDeleteRole?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  role: null,
  loading: false,
  canDeleteRole: false
})

// ===== EMITS =====
interface Emits {
  'submit': [data: RoleCreateRequest | RoleUpdateRequest]
  'cancel': []
  'delete': [role: Role]
}

const emit = defineEmits<Emits>()

// ===== REACTIVE STATE =====
const form = ref()

interface FormData {
  name: string
  description: string
}

const formData = reactive<FormData>({
  name: '',
  description: ''
})

// ===== VALIDATION SCHEMA =====
const validationSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(100, 'Role name is too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(500, 'Description is too long')
    .optional()
})

// ===== COMPUTED PROPERTIES =====
const isFormValid = computed(() => {
  try {
    validationSchema.parse(formData)
    return true
  } catch {
    return false
  }
})

// ===== METHODS =====
const populateForm = () => {
  if (props.role && props.mode === 'edit') {
    formData.name = props.role.name
    formData.description = props.role.description || ''
  }
}

const resetForm = () => {
  formData.name = ''
  formData.description = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  const submitData: RoleCreateRequest | RoleUpdateRequest = {
    name: formData.name.trim(),
    description: formData.description.trim() || undefined
  }

  emit('submit', submitData)
}

const handleCancel = () => {
  if (props.mode === 'create') {
    resetForm()
  } else {
    populateForm()
  }
  emit('cancel')
}

const handleDelete = () => {
  if (props.role) {
    emit('delete', props.role)
  }
}

// ===== WATCHERS =====
watch(() => props.role, populateForm, { immediate: true })
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
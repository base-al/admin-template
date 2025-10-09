<script setup lang="ts">
import { z } from 'zod'
import type { Role } from '~/types'

interface Props {
  modelValue: boolean
  mode: 'create' | 'edit'
  role?: Role | null
  loading?: boolean
}

interface RoleFormData {
  name: string
  description?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: RoleFormData): void
}

const props = withDefaults(defineProps<Props>(), {
  role: null,
  loading: false
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formState = reactive({
  name: '',
  description: ''
})

// Validation schema
const schema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(100, 'Role name is too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(500, 'Description is too long')
    .optional()
})

const resetForm = () => {
  Object.assign(formState, {
    name: '',
    description: ''
  })
}

const populateForm = (role: Role) => {
  Object.assign(formState, {
    name: role.name,
    description: role.description || ''
  })
}

const handleSubmit = async () => {
  try {
    schema.parse(formState)

    const submitData: RoleFormData = {
      name: formState.name.trim(),
      description: formState.description.trim() || undefined
    }

    emit('submit', submitData)
  } catch (error) {
    console.error('Validation error:', error)
  }
}

// Watch for mode and role changes
watch(() => props.mode, (newMode) => {
  if (newMode === 'create') {
    resetForm()
  }
})

watch(() => props.role, (newRole) => {
  if (newRole && props.mode === 'edit') {
    populateForm(newRole)
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
        {{ mode === 'create' ? 'Create Role' : 'Edit Role' }}
      </h3>
    </template>

    <template #body>
      <UForm
        :state="formState"
        :schema="schema"
        class="space-y-6"
        @submit="handleSubmit"
      >
        <!-- Role Name -->
        <UFormField label="Role Name" name="name" required>
          <UInput
            v-model="formState.name"
            placeholder="Administrator, Manager, Editor..."
            :disabled="loading"
          />
          <template #help>
            <p class="text-xs text-gray-500">Choose a descriptive name for this role</p>
          </template>
        </UFormField>

        <!-- Description -->
        <UFormField label="Description" name="description">
          <UTextarea
            v-model="formState.description"
            placeholder="Describe the role's responsibilities and access level..."
            :disabled="loading"
            :rows="4"
          />
          <template #help>
            <p class="text-xs text-gray-500">Help others understand what this role is for</p>
          </template>
        </UFormField>

        <!-- System Role Warning (for edit mode) -->
        <div v-if="mode === 'edit' && role?.is_system" class="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">System Role</p>
            <p class="text-xs text-yellow-600 dark:text-yellow-400">This is a system role. Some properties may be restricted.</p>
          </div>
        </div>

        <!-- Info Box (for create mode) -->
        <div v-if="mode === 'create'" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p class="font-medium mb-1">Permission Assignment</p>
              <p>After creating this role, you'll be able to assign specific permissions to it through the Permissions page.</p>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <UButton
            type="submit"
            :loading="loading"
            :disabled="loading"
          >
            {{ mode === 'create' ? 'Create Role' : 'Update Role' }}
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

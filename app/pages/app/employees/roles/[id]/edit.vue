<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Role } from '~/types/authorization'

definePageMeta({
  title: 'Edit Role',
  description: 'Update role information and permissions'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const roleId = computed(() => {
  const id = route.params.id as string
  return parseInt(id, 10)
})

// Fetch role data using API composable
const api = useApi()
const roleResponse = ref<{ data: Role } | null>(null)
const pending = ref(true)

const fetchRole = async () => {
  try {
    pending.value = true
    const response = await api.get<{ data: Role }>(`/authorization/roles/${roleId.value}`)
    roleResponse.value = response
  } catch (error) {
    console.error('Failed to fetch role:', error)
    roleResponse.value = null
  } finally {
    pending.value = false
  }
}

await fetchRole()

// Computed role data
const role = computed(() => roleResponse.value?.data || null)

// Redirect if it's a system role
watch(role, (newRole) => {
  if (newRole && newRole.is_system) {
    toast.add({
      title: 'Cannot Edit',
      description: 'System roles cannot be edited',
      color: 'error'
    })
    router.push(`/app/employees/roles/${roleId.value}`)
  }
}, { immediate: true })

// Form validation schema
const schema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name too long'),
  description: z.string().optional(),
})

type Schema = z.output<typeof schema>

// Form state
const state = reactive<Partial<Schema>>({
  name: '',
  description: ''
})

const isSubmitting = ref(false)

// Watch for role data and populate form
watch(role, (newRole) => {
  if (newRole && !newRole.is_system) {
    state.name = newRole.name
    state.description = newRole.description || ''
  }
}, { immediate: true })

// Form submission
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!role.value || role.value.is_system) return
  
  isSubmitting.value = true
  
  try {
    const api = useApi()
    await api.put(`/authorization/roles/${role.value.id}`, event.data)
    
    toast.add({
      title: 'Success',
      description: 'Role updated successfully',
      color: 'success'
    })
    await router.push(`/app/employees/roles/${role.value.id}`)
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to update role',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="edit-role">
    <template #header>
      <UDashboardNavbar :title="`Edit ${role?.name || 'Role'}`">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="router.back()"
          >
            Back
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="pending" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
      </div>

      <div v-else-if="role && !role.is_system" class="max-w-2xl mx-auto">
        <UForm 
          :schema="schema" 
          :state="state" 
          class="space-y-8"
          @submit="onSubmit"
        >
          <!-- Role Information Section -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-shield" class="w-5 h-5 text-primary-500" />
                <h3 class="text-lg font-semibold">Role Information</h3>
              </div>
            </template>

            <div class="space-y-4">
              <UFormField label="Role Name" name="name" required>
                <UInput 
                  v-model="state.name"
                  placeholder="Administrator, Manager, Editor..."
                  icon="i-lucide-shield"
                />
                <template #help>
                  <p class="text-xs text-gray-500">Choose a descriptive name for this role</p>
                </template>
              </UFormField>
              
              <UFormField label="Description" name="description" optional>
                <UTextarea 
                  v-model="state.description"
                  placeholder="Brief description of this role's purpose and responsibilities..."
                  :rows="4"
                />
                <template #help>
                  <p class="text-xs text-gray-500">Help others understand what this role is for</p>
                </template>
              </UFormField>
            </div>
          </UCard>

          <!-- Current Information -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500" />
                <h3 class="text-lg font-semibold">Current Information</h3>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Current Name</label>
                <p class="text-gray-900">{{ role.name }}</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                <p class="text-gray-900">{{ role.permission_count || 0 }} assigned</p>
              </div>
            </div>
          </UCard>

          <!-- Permissions Notice -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-key" class="w-5 h-5 text-amber-500" />
                <h3 class="text-lg font-semibold">Permissions</h3>
              </div>
            </template>

            <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-amber-600 mt-0.5" />
                <div class="text-sm text-amber-800">
                  <p class="font-medium mb-1">Permission Management</p>
                  <p>To modify permissions for this role, use the Permissions management section. This form only updates the basic role information.</p>
                  <UButton
                    label="Manage Permissions"
                    size="xs"
                    color="primary"
                    class="mt-2"
                    @click="navigateTo(`/app/employees/roles/${role?.id}/permissions`)"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              :disabled="isSubmitting"
              @click="router.back()"
            />
            <UButton
              type="submit"
              label="Update Role"
              icon="i-lucide-save"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            />
          </div>
        </UForm>
      </div>

      <div v-else-if="role?.is_system" class="max-w-2xl mx-auto">
        <UCard class="border-red-200 bg-red-50">
          <div class="text-center py-8">
            <UIcon name="i-lucide-shield-alert" class="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 class="text-lg font-semibold text-red-900">Cannot Edit System Role</h2>
            <p class="text-red-700 mt-2">System roles are protected and cannot be modified.</p>
            <UButton
              label="View Role Details"
              class="mt-4"
              @click="router.push(`/app/employees/roles/${role.id}`)"
            />
          </div>
        </UCard>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-12">
        <UIcon name="i-lucide-shield-x" class="w-12 h-12 text-gray-400 mb-4" />
        <h2 class="text-lg font-semibold text-gray-900">Role not found</h2>
        <p class="text-gray-600 mt-1">The role you're looking for doesn't exist.</p>
        <UButton
          label="Back to Roles"
          class="mt-4"
          @click="router.push('/app/employees/roles')"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
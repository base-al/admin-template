<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Role } from '~/types'

definePageMeta({
  title: 'New Role',
  description: 'Create a new user role with specific permissions'
})

const router = useRouter()
const toast = useToast()

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

// Form submission
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  
  try {
    const api = useApi()
    const response = await api.post('/authorization/roles', event.data) as { data: Role }
    
    toast.add({
      title: 'Success',
      description: 'Role created successfully',
      color: 'success'
    })
    await router.push(`/app/users/roles/${response.data.id}`)
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to create role',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="new-role">
    <template #header>
      <UDashboardNavbar title="New Role">
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
      <div class="max-w-2xl mx-auto">
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
              
              <UFormField label="Description" name="description">
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

          <!-- Permissions Notice -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500" />
                <h3 class="text-lg font-semibold">Permissions</h3>
              </div>
            </template>

            <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-blue-600 mt-0.5" />
                <div class="text-sm text-blue-800">
                  <p class="font-medium mb-1">Permission Assignment</p>
                  <p>After creating this role, you'll be able to assign specific permissions to it. You can also manage permissions through the Permissions tab.</p>
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
              label="Create Role"
              icon="i-lucide-plus"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            />
          </div>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
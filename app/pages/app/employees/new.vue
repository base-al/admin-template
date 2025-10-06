<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { CreateEmployeeRequest } from '~/types/employee'

definePageMeta({
  title: 'New Employee',
  description: 'Add a new team Employee with role-based access'
})

// Use the authorization composable
const { roleOptions } = useAuthorization()

// Stores
const employeesStore = useEmployeesStore()
const toast = useToast()
const router = useRouter()

// Form validation schema
const schema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long'),
  email: z.string().email('Invalid email address').max(100, 'Email too long'),
  phone: z.string().optional(),
  role_id: z.number().min(1, 'Please select a role'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(50, 'Password too long')
})

type Schema = z.output<typeof schema>

// Form state
const state = reactive<Partial<Schema>>({
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone: '',
  role_id: roleOptions.value[0]?.value || undefined,
  password: ''
})

const isSubmitting = ref(false)

// Form submission
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  
  try {
    const result = await employeesStore.createEmployee(event.data as CreateEmployeeRequest)
    
    if (result.success) {
      toast.add({
        title: 'Success',
        description: 'Employee created successfully',
        color: 'success'
      })
      await router.push('/app/employees')
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to create employee',
        color: 'error'
      })
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to create employee',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="new-employee">
    <template #header>
      <UDashboardNavbar title="New Employee">
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
          <!-- Personal Information Section -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-user" class="w-5 h-5 text-primary-500" />
                <h3 class="text-lg font-semibold">Personal Information</h3>
              </div>
            </template>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="First Name" name="first_name" required>
                  <UInput 
                    v-model="state.first_name"
                    placeholder="John"
                    icon="i-lucide-user"
                  />
                </UFormField>
                
                <UFormField label="Last Name" name="last_name" required>
                  <UInput 
                    v-model="state.last_name"
                    placeholder="Doe"
                  />
                </UFormField>
              </div>
              
              <UFormField label="Phone Number" name="phone" optional>
                <UInput 
                  v-model="state.phone"
                  placeholder="+383 44 123 456"
                  icon="i-lucide-phone"
                />
              </UFormField>
            </div>
          </UCard>

          <!-- Account Information Section -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-key" class="w-5 h-5 text-primary-500" />
                <h3 class="text-lg font-semibold">Account Information</h3>
              </div>
            </template>

            <div class="space-y-4">
              <UFormField label="Username" name="username" required>
                <UInput 
                  v-model="state.username"
                  placeholder="johndoe"
                  icon="i-lucide-at-sign"
                />
              </UFormField>
              
              <UFormField label="Email Address" name="email" required>
                <UInput 
                  v-model="state.email"
                  type="email"
                  placeholder="john@company.com"
                  icon="i-lucide-mail"
                />
              </UFormField>
              
              <UFormField label="Password" name="password" required>
                <UInput 
                  v-model="state.password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  icon="i-lucide-lock"
                />
              </UFormField>
            </div>
          </UCard>

          <!-- Role & Permissions Section -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-shield" class="w-5 h-5 text-primary-500" />
                <h3 class="text-lg font-semibold">Role & Permissions</h3>
              </div>
            </template>

            <div class="space-y-4">
              <UFormField label="Role" name="role_id" required>
                <USelect
                  v-model="state.role_id"
                  :items="roleOptions"
                  placeholder="Select a role"
                  icon="i-lucide-shield"
                  value-attribute="value"
                  option-attribute="label"
                >
                  <template #item="{ item }">
                    <div class="flex flex-col">
                      <span class="font-medium">{{ item.label }}</span>
                      <span v-if="item.description" class="text-xs text-gray-500">
                        {{ item.description }}
                      </span>
                    </div>
                  </template>
                </USelect>
              </UFormField>
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
              label="Create Employee"
              icon="i-lucide-user-plus"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            />
          </div>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
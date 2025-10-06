<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  title: 'System Settings'
})

 

const systemSchema = z.object({
  invoice_prefix: z.string().min(1, 'Invoice prefix is required').max(10, 'Invoice prefix too long'),
  grace_period_days: z.number().min(0, 'Grace period cannot be negative').max(30, 'Grace period too long'),
  auto_suspend_after_days: z.number().min(0, 'Auto-suspend days cannot be negative').max(365, 'Auto-suspend period too long'),
  maintenance_mode: z.boolean()
})

type SystemSchema = z.output<typeof systemSchema>

const settingsStore = useSettingsStore()
const toast = useToast()

const formData = reactive<SystemSchema>({
  invoice_prefix: 'NEG',
  grace_period_days: 1,
  auto_suspend_after_days: 7,
  maintenance_mode: false
})

// Computed properties from store
const loading = computed(() => settingsStore.isLoading)
const saving = computed(() => settingsStore.isSaving)
const systemSettings = computed(() => settingsStore.systemSettings)

// Watch for settings changes and update form data
watch(systemSettings, (settings) => {
  settings.forEach(setting => {
    if (setting.setting_key === 'invoice_prefix' && setting.type === 'string') {
      formData.invoice_prefix = setting.value_string
    } else if (setting.setting_key === 'grace_period_days' && setting.type === 'int') {
      formData.grace_period_days = setting.value_int
    } else if (setting.setting_key === 'auto_suspend_after_days' && setting.type === 'int') {
      formData.auto_suspend_after_days = setting.value_int
    } else if (setting.setting_key === 'maintenance_mode' && setting.type === 'bool') {
      formData.maintenance_mode = setting.value_bool
    }
  })
}, { immediate: true })

// Save settings
const saveSettings = async (event: FormSubmitEvent<SystemSchema>) => {
  try {
    await settingsStore.updateSystemSettings(event.data)
    
    toast.add({
      title: 'Success',
      description: 'System settings updated successfully',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to update settings:' + error,
      color: 'error'
    })
  }
}

// Load settings on mount
onMounted(async () => {
  try {
    await settingsStore.fetchSettings()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to load settings:' + error,
      color: 'error'
    })
  }
})
</script>

<template>
  <UForm
    id="system-settings"
    :schema="systemSchema"
    :state="formData"
    @submit="saveSettings"
  >
    <UPageCard
      title="System Settings"
      description="Configure system behavior, maintenance mode, and operational parameters."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="system-settings"
        label="Save changes"
        color="primary"
        type="submit"
        :loading="saving"
        :disabled="loading || saving"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard v-if="!loading" variant="subtle">
      <UFormField
        name="invoice_prefix"
        label="Invoice Prefix"
        description="Prefix used for invoice numbering (e.g., NEG-2025-001)"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="formData.invoice_prefix"
          placeholder="NEG"
          maxlength="10"
          autocomplete="off"
          class="w-full min-w-[300px]"
        />
      </UFormField>
      
      <USeparator />
      
      <UFormField
        name="grace_period_days"
        label="Grace Period Days"
        description="Number of days to extend service for residential customers"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="relative">
          <UInput
            v-model.number="formData.grace_period_days"
            type="number"
            min="0"
            max="30"
            placeholder="1"
            class="w-full min-w-[300px]"
          />
          <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">days</span>
        </div>
      </UFormField>

      <USeparator />

      <UFormField
        name="auto_suspend_after_days"
        label="Auto-Suspend After"
        description="Days after expiry before automatically suspending services"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="relative">
          <UInput
            v-model.number="formData.auto_suspend_after_days"
            type="number"
            min="0"
            max="365"
            placeholder="7"
            class="w-full min-w-[300px]"
          />
          <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">days</span>
        </div>
      </UFormField>

      <USeparator />

      <UFormField
        name="maintenance_mode"
        label="Maintenance Mode"
        description="Enable maintenance mode to temporarily disable customer access"
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex items-center gap-3">
          <USwitch
            v-model="formData.maintenance_mode"
            
          />
          <span class="text-sm" :class="formData.maintenance_mode ? 'text-red-600 font-medium' : 'text-gray-600'">
            {{ formData.maintenance_mode ? 'Maintenance mode enabled' : 'Normal operation' }}
          </span>
        </div>
      </UFormField>
    </UPageCard>

    <UPageCard v-else variant="subtle">
      <div class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>
    </UPageCard>

    <!-- Warning for maintenance mode -->
    <UAlert 
      v-if="formData.maintenance_mode && !loading"
      color="error"
      variant="soft"
      title="Maintenance Mode Active"
      description="When maintenance mode is enabled, customers will see a maintenance page and cannot access services."
      icon="i-lucide-alert-triangle"
      class="mt-6"
    />

    <!-- Information Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-file-text" class="w-5 h-5" />
            <h4 class="font-semibold">Invoice Numbering</h4>
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <p>• Format: PREFIX-YEAR-NUMBER</p>
          <p>• Example: {{ formData.invoice_prefix }}-2025-001</p>
          <p>• Numbers reset each year</p>
          <p>• Keep prefix short and meaningful</p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-clock" class="w-5 h-5" />
            <h4 class="font-semibold">Service Management</h4>
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <p>• Grace period: {{ formData.grace_period_days }} day(s)</p>
          <p>• Auto-suspend: {{ formData.auto_suspend_after_days }} day(s)</p>
          <p>• Grace applies to residential only</p>
          <p>• Business customers are post-paid</p>
        </div>
      </UCard>
    </div>
  </UForm>
</template>
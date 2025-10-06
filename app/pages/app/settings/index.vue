<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  title: 'Company Settings'
})

 
const companySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  company_address: z.string().min(1, 'Company address is required'),
  company_phone: z.string().min(1, 'Phone number is required'),
  company_email: z.string().email('Invalid email address'),
  company_website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  company_nui: z.string().min(1, 'Tax number is required')
})

type CompanySchema = z.output<typeof companySchema>

const settingsStore = useSettingsStore()
const toast = useToast()

const formData = reactive<CompanySchema>({
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  company_website: '',
  company_nui: ''
})

// Computed properties from store
const loading = computed(() => settingsStore.isLoading)
const saving = computed(() => settingsStore.isSaving)
const companySettings = computed(() => settingsStore.companySettings)

// Watch for settings changes and update form data
watch(companySettings, (settings) => {
  settings.forEach(setting => {
    if (setting.type === 'string') {
      formData[setting.setting_key as keyof CompanySchema] = setting.value_string
    }
  })
}, { immediate: true })

// Save settings
const saveSettings = async (event: FormSubmitEvent<CompanySchema>) => {
  try {
    await settingsStore.updateCompanySettings(event.data)
    
    toast.add({
      title: 'Success',
      description: 'Company settings updated successfully',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to update settings: ' + error,
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
      description: 'Failed to load settings: ' + error,
      color: 'error'
    })
  }
})
</script>

<template>
  <UForm
    id="company-settings"
    :schema="companySchema"
    :state="formData"
    @submit="saveSettings"
  >
    <UPageCard
      title="Company Information"
      description="Manage your company details that appear on invoices and documents."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="company-settings"
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
        name="company_name"
        label="Company Name"
        description="Your company name as it appears on invoices and documents"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="formData.company_name"
          placeholder="Enter company name"
          autocomplete="off"
          class="w-full min-w-[300px]"
        />
      </UFormField>
      
      <USeparator />
      
      <UFormField
        name="company_address"
        label="Business Address"
        description="Your complete business address"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea
          v-model="formData.company_address"
          placeholder="Enter company address"
          :rows="3"
          class="w-full min-w-[300px]"
        />
      </UFormField>

      <USeparator />

      <UFormField
        name="company_phone"
        label="Phone Number"
        description="Main contact phone number"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="formData.company_phone"
          placeholder="+383 XX XXX XXX"
          autocomplete="off"
          class="w-full min-w-[300px]"
        />
      </UFormField>

      <USeparator />

      <UFormField
        name="company_email"
        label="Email Address"
        description="Main contact email address"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="formData.company_email"
          type="email"
          placeholder="info@company.com"
          autocomplete="off"
          class="w-full min-w-[300px]"
        />
      </UFormField>

      <USeparator />

      <UFormField
        name="company_website"
        label="Website URL"
        description="Company website URL (optional)"
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="formData.company_website"
          placeholder="https://company.com"
          autocomplete="off"
          class="w-full min-w-[300px]"
        />
      </UFormField>

      <USeparator />

      <UFormField
        name="company_nui"
        label="Kosovo Tax Number (NUI)"
        description="Your Kosovo tax identification number"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="formData.company_nui"
          placeholder="70XXXXXX"
          autocomplete="off"
          class="w-full min-w-[300px]"
        />
      </UFormField>
    </UPageCard>

    <UPageCard v-else variant="subtle">
      <div class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>
    </UPageCard>
  </UForm>
</template>

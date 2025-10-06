<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  title: 'Email Settings'
})
 

const emailSchema = z.object({
  email_from_name: z.string().min(1, 'From name is required'),
  email_signature: z.string().min(1, 'Email signature is required')
})

type EmailSchema = z.output<typeof emailSchema>

const settingsStore = useSettingsStore()
const toast = useToast()

const formData = reactive<EmailSchema>({
  email_from_name: '',
  email_signature: ''
})

// Computed properties from store
const loading = computed(() => settingsStore.isLoading)
const saving = computed(() => settingsStore.isSaving)
const emailSettings = computed(() => settingsStore.emailSettings)

// Watch for settings changes and update form data
watch(emailSettings, (settings) => {
  settings.forEach(setting => {
    if (setting.setting_key === 'email_from_name' && setting.type === 'string') {
      formData.email_from_name = setting.value_string
    } else if (setting.setting_key === 'email_signature' && setting.type === 'string') {
      formData.email_signature = setting.value_string
    }
  })
}, { immediate: true })

// Save settings
const saveSettings = async (event: FormSubmitEvent<EmailSchema>) => {
  try {
    await settingsStore.updateEmailSettings(event.data)
    
    toast.add({
      title: 'Success',
      description: 'Email settings updated successfully',
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
    id="email-settings"
    :schema="emailSchema"
    :state="formData"
    @submit="saveSettings"
  >
    <UPageCard
      title="Email Settings"
      description="Configure email templates, signatures, and sender information."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="email-settings"
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
        name="email_from_name"
        label="From Name"
        description="The sender name that appears in outgoing emails"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="formData.email_from_name"
          placeholder="Negenet ISP Support"
          autocomplete="off"
          class="w-full min-w-[300px]"  
        />
      </UFormField>
      
      <USeparator />
      
      <UFormField
        name="email_signature"
        label="Email Signature"
        description="Default signature added to all outgoing emails"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea
          v-model="formData.email_signature"
          placeholder="Best regards,&#10;Negenet ISP Team&#10;info@negenet.net&#10;+383 XX XXX XXX"
          :rows="6"
          class="w-full min-w-[300px]"
        />
      </UFormField>
    </UPageCard>

    <UPageCard v-else variant="subtle">
      <div class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>
    </UPageCard>

    <!-- Preview Card -->
    <UCard v-if="!loading" class="mt-6">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-eye" class="w-5 h-5" />
          <h4 class="font-semibold">Email Preview</h4>
        </div>
      </template>
      <div class="space-y-4">
        <div class="border-l-4 border-gray-200 dark:border-gray-700 pl-4">
          <div class="text-sm text-gray-600 dark:text-gray-300 mb-2">From: {{ formData.email_from_name || 'Negenet ISP Support' }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-300 mb-4">Subject: Welcome to Negenet ISP</div>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p class="text-sm mb-4">Dear Customer,</p>
            <p class="text-sm mb-4">Welcome to Negenet ISP! Your internet service has been successfully activated.</p>
            <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <pre class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans">{{ formData.email_signature || 'Best regards,\nNegenet ISP Team\ninfo@negenet.net\n+383 XX XXX XXX' }}</pre>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Information Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-info" class="w-5 h-5" />
            <h4 class="font-semibold">Email Guidelines</h4>
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <p>• Keep from name professional and clear</p>
          <p>• Include contact information in signature</p>
          <p>• Use consistent branding</p>
          <p>• Test emails before deployment</p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-mail" class="w-5 h-5" />
            <h4 class="font-semibold">Email Types</h4>
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <p>• Welcome emails for new customers</p>
          <p>• Invoice and payment notifications</p>
          <p>• Service suspension warnings</p>
          <p>• Support and maintenance updates</p>
        </div>
      </UCard>
    </div>
  </UForm>
</template>
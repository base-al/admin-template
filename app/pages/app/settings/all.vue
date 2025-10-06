<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  title: 'All Settings'
})

const settingsStore = useSettingsStore()
const toast = useToast()

// Computed properties from store
const loading = computed(() => settingsStore.isLoading)
const saving = computed(() => settingsStore.isSaving)

// Group settings by their group property
const settingGroups = computed(() => {
  const groups: Record<string, Setting[]> = {}
  settingsStore.settings.forEach(setting => {
    if (!groups[setting.group]) {
      groups[setting.group] = []
    }
    groups[setting.group]?.push(setting)
  })
  return groups
})

// Create dynamic form data based on all settings
const formData = reactive<Record<string, unknown>>({})

// Dynamic schema generation based on settings
const createDynamicSchema = () => {
  const schemaFields: Record<string, unknown> = {}
  
  settingsStore.settings.forEach(setting => {
    switch (setting.type) {
      case 'string':
        schemaFields[setting.setting_key] = z.string().min(1, `${setting.label} is required`)
        break
      case 'int':
        schemaFields[setting.setting_key] = z.number().min(0, `${setting.label} must be positive`)
        break
      case 'float':
        schemaFields[setting.setting_key] = z.number().min(0, `${setting.label} must be positive`)
        break
      case 'bool':
        schemaFields[setting.setting_key] = z.boolean()
        break
    }
  })
  
  return z.object(schemaFields)
}

// Watch for settings changes and update form data
watch(() => settingsStore.settings, (settings) => {
  settings.forEach(setting => {
    switch (setting.type) {
      case 'string':
        formData[setting.setting_key] = setting.value_string
        break
      case 'int':
        formData[setting.setting_key] = setting.value_int
        break
      case 'float':
        formData[setting.setting_key] = setting.value_float
        break
      case 'bool':
        formData[setting.setting_key] = setting.value_bool
        break
    }
  })
}, { immediate: true, deep: true })

// Group icons mapping
const groupIcons: Record<string, string> = {
  company: 'i-lucide-building',
  financial: 'i-lucide-banknote',
  system: 'i-lucide-settings',
  email: 'i-lucide-mail',
  service: 'i-lucide-service',
  radius: 'i-lucide-wifi',
  olt: 'i-lucide-network'
}

// Group colors for visual distinction
const groupColors: Record<string, string> = {
  company: 'blue',
  financial: 'green', 
  system: 'gray',
  email: 'purple',
  service: 'orange',
  radius: 'cyan',
  olt: 'yellow'
}

// Get form field component based on setting type
const _getFieldComponent = (setting: Setting) => {
  switch (setting.type) {
    case 'bool':
      return 'USwitch'
    case 'int':
    case 'float':
      return 'UInput'
    default:
      return 'UInput'
  }
}

// Get input type for UInput
const getInputType = (setting: Setting) => {
  switch (setting.type) {
    case 'int':
    case 'float':
      return 'number'
    default:
      return 'text'
  }
}

// Save all settings
const saveSettings = async (event: FormSubmitEvent<Record<string, unknown>>) => {
  try {
    // Convert form data to individual setting updates
    const settingUpdates = Object.entries(event.data).map(([key, value]) => ({
      setting_key: key,
      value_string: typeof value === 'string' ? value : '',
      value_int: typeof value === 'number' && Number.isInteger(value) ? value : 0,
      value_float: typeof value === 'number' && !Number.isInteger(value) ? value : 0,
      value_bool: typeof value === 'boolean' ? value : false
    }))

    await settingsStore.updateMultipleSettings(settingUpdates)
    
    toast.add({
      title: 'Success',
      description: 'All settings updated successfully',
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
    id="all-settings"
    :schema="createDynamicSchema()"
    :state="formData"
    @submit="saveSettings"
  >
    <UPageCard
      title="All Settings"
      description="Manage all system settings from a single page. Settings are organized by category for easy navigation."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="all-settings"
        label="Save all changes"
        color="primary"
        type="submit"
        :loading="saving"
        :disabled="loading || saving"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <div v-if="!loading" class="space-y-8">
      <!-- Dynamically generated setting groups -->
      <UPageCard
        v-for="(settings, groupName) in settingGroups"
        :key="groupName"
        variant="subtle"
        class="group-card"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon 
              :name="groupIcons[groupName] || 'i-lucide-settings'" 
              class="w-6 h-6"
              :class="`text-${groupColors[groupName] || 'gray'}-500`"
            />
            <div>
              <h2 class="text-lg font-semibold capitalize">{{ groupName }} Settings</h2>
              <p class="text-sm text-gray-500">{{ settings.length }} setting{{ settings.length !== 1 ? 's' : '' }}</p>
            </div>
          </div>
        </template>

        <div class="space-y-6">
          <UFormField
            v-for="setting in settings"
            :key="setting.setting_key"
            :name="setting.setting_key"
            :label="setting.label"
            :description="setting.description"
            :required="!setting.is_nullable"
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <!-- Boolean fields (switches) -->
            <template v-if="setting.type === 'bool'">
              <div class="flex items-center gap-3">
                <USwitch
                  v-model="formData[setting.setting_key]"
                />
                <span 
                  class="text-sm"
                  :class="formData[setting.setting_key] ? 'text-green-600 font-medium' : 'text-gray-600'"
                >
                  {{ formData[setting.setting_key] ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </template>

            <!-- Number fields with suffix -->
            <template v-else-if="setting.type === 'int' || setting.type === 'float'">
              <div class="relative w-full min-w-[300px]">
                <UInput
                  v-model.number="formData[setting.setting_key]"
                  :type="getInputType(setting)"
                  :min="setting.type === 'int' ? '0' : '0.0'"
                  :step="setting.type === 'float' ? '0.1' : '1'"
                  class="w-full"
                  :placeholder="String(setting.type === 'int' ? setting.value_int : setting.value_float)"
                />
                <!-- Add common suffixes for known fields -->
                <span 
                  v-if="setting.setting_key.includes('timeout') || setting.setting_key.includes('days')"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
                >
                  {{ setting.setting_key.includes('timeout') ? 'sec' : 'days' }}
                </span>
                <span 
                  v-else-if="setting.setting_key.includes('port')"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
                >
                  port
                </span>
                <span 
                  v-else-if="setting.setting_key.includes('length')"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
                >
                  chars
                </span>
              </div>
            </template>

            <!-- String fields -->
            <template v-else>
              <UInput
                v-model="formData[setting.setting_key]"
                :type="setting.setting_key.includes('password') || setting.setting_key.includes('key') ? 'password' : 'text'"
                :placeholder="setting.value_string || setting.label"
                autocomplete="off"
                class="w-full min-w-[300px]"
              />
            </template>
          </UFormField>
        </div>
      </UPageCard>
    </div>

    <UPageCard v-else variant="subtle">
      <div class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>
    </UPageCard>

    <!-- Summary Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      <UCard v-for="(settings, groupName) in settingGroups" :key="`summary-${groupName}`">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon 
              :name="groupIcons[groupName] || 'i-lucide-settings'" 
              class="w-5 h-5"
              :class="`text-${groupColors[groupName] || 'gray'}-500`"
            />
            <h4 class="font-semibold capitalize">{{ groupName }}</h4>
          </div>
        </template>
        <div class="space-y-1 text-sm">
          <p>• Total: {{ settings.length }} settings</p>
          <p>• Boolean: {{ settings.filter(s => s.type === 'bool').length }}</p>
          <p>• Numeric: {{ settings.filter(s => s.type === 'int' || s.type === 'float').length }}</p>
          <p>• Text: {{ settings.filter(s => s.type === 'string').length }}</p>
        </div>
      </UCard>
    </div>
  </UForm>
</template>

<style scoped>
.group-card {
  transition: all 0.2s ease;
}

.group-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
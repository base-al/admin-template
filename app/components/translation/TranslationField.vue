<template>
  <div class="inline-flex items-center">
    <!-- Label value -->
    <span :class="labelClass">{{ displayValue }}</span>
    
    <!-- Translation status dots -->
    <UPopover v-if="isTranslatableField" mode="hover" :popper="{ placement: 'bottom' }">
      <div class="inline-flex items-center ml-2">
        <div class="flex items-center space-x-1">
          <span 
            v-for="(langName, langCode) in SUPPORTED_LANGUAGES" 
            :key="langCode"
            :class="[
              'inline-block w-2 h-2 rounded-full border transition-colors cursor-help',
              hasTranslation(langCode) 
                ? getTranslatedColor(langCode)
                : 'bg-gray-200 border-gray-300'
            ]"
            :title="`${langName}: ${hasTranslation(langCode) ? 'Translated' : 'Not translated'}`"
          />
        </div>
      </div>

      <template #content>
        <div class="p-3">
          <div class="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Translation Status</div>
          <div class="space-y-2">
            <div 
              v-for="(langName, langCode) in SUPPORTED_LANGUAGES" 
              :key="langCode"
              class="flex items-center justify-between space-x-4 text-xs"
            >
              <div class="flex items-center space-x-2">
                <span 
                  :class="[
                    'w-2 h-2 rounded-full border flex-shrink-0',
                    hasTranslation(langCode) 
                      ? getTranslatedColor(langCode)
                      : 'bg-gray-200 border-gray-300'
                  ]"
                />
                <span class="font-mono font-semibold text-gray-900 dark:text-gray-100">{{ langCode.toUpperCase() }}</span>
                <span class="text-gray-500 dark:text-gray-400">{{ langName }}</span>
              </div>
              <UBadge 
                :color="hasTranslation(langCode) ? 'success' : 'warning'" 
                variant="soft" 
                size="xs"
              >
                {{ hasTranslation(langCode) ? 'Translated' : 'Missing' }}
              </UBadge>
            </div>
          </div>
          
          <!-- Show available translations if any -->
          <div v-if="availableTranslations.length > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div class="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Available Translations</div>
            <div class="space-y-1">
              <div 
                v-for="translation in availableTranslations" 
                :key="translation.lang"
                class="text-xs"
              >
                <span class="font-mono font-semibold">{{ translation.lang.toUpperCase() }}:</span>
                <span class="ml-2 text-gray-600 dark:text-gray-400">{{ translation.value }}</span>
              </div>
            </div>
          </div>
          <USeparator  class="my-2" />
          <UButton label="Manage Translations" color="primary" variant="soft" size="xs" @click="editTranslation" />
        </div>
      </template>
    </UPopover>

    <!-- Translation Management Modal -->
    <UModal v-model:open="showTranslationModal" :title="`Manage Translations - ${props.field}`">
      <template #body>
        <div class="space-y-4">
          <!-- Original Value Display -->
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original Value</div>
            <div class="font-mono text-sm">{{ displayValue }}</div>
          </div>

          <!-- Translation Form -->
          <div class="space-y-3">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">Translations</div>
            <div 
              v-for="(langName, langCode) in SUPPORTED_LANGUAGES" 
              :key="langCode"
              class="space-y-2"
            >
              <UFormField :label="`${langName} (${langCode.toUpperCase()})`">
                <UInput
                  v-model="editableTranslations[langCode]"
                  :placeholder="`Enter ${langName} translation...`"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-between items-center">
          <div class="text-xs text-gray-500">
            {{ Object.keys(editableTranslations).filter(key => editableTranslations[key]).length }} / {{ Object.keys(SUPPORTED_LANGUAGES).length }} languages translated
          </div>
          <div class="flex gap-2">
            <UButton color="neutral" variant="ghost" @click="closeTranslationModal">
              Cancel
            </UButton>
            <UButton 
              color="primary" 
              :loading="savingTranslations"
              :disabled="!canSaveTranslations"
              @click="saveTranslations"
            >
              Save Translations
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useTranslation, type TranslationField } from '@@/app/composables/useTranslation'

interface Props {
  field: string
  value: string | TranslationField | undefined
  modelId?: number
  modelType?: string
  translations?: Record<string, Record<string, string>>
  labelClass?: string
  fallback?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelId: undefined,
  modelType: undefined,
  translations: undefined,
  labelClass: '',
  fallback: '—'
})


// Emit events
const emit = defineEmits<{
  translationsUpdated: [field: string, translations: Record<string, string>]
}>()

const { SUPPORTED_LANGUAGES, saveFieldTranslations } = useTranslation()

// Modal state
const showTranslationModal = ref(false)
const savingTranslations = ref(false)
const editableTranslations = reactive<Record<string, string>>({})

// Local state to track saved translations for immediate UI updates
const localTranslations = reactive<Record<string, string>>({})

// Get the display value (original or string value)
const displayValue = computed(() => {
  if (!props.value) return props.fallback
  
  // If it's a translation object with 'original' property
  if (typeof props.value === 'object' && 'original' in props.value) {
    return props.value.original || props.fallback
  }
  
  // If it's a plain string
  if (typeof props.value === 'string') {
    return props.value || props.fallback
  }
  
  return props.fallback
})

// Check if the field is translatable
const isTranslatableField = computed(() => {
  if (!props.value) return false
  
  // If it's an object with 'original' property, it's translatable
  if (typeof props.value === 'object' && 'original' in props.value) {
    return true
  }
  
  // If translations are provided and this field has translations, it's translatable
  if (props.translations && props.translations[props.field]) {
    return true
  }
  
  return false
})

// Get available translations for popover display
const availableTranslations = computed(() => {
  const translations: Array<{lang: string, value: string}> = []
  const processedLanguages = new Set<string>()
  
  // First, add local translations (highest priority for display)
  for (const [langCode, value] of Object.entries(localTranslations)) {
    if (value && langCode in SUPPORTED_LANGUAGES) {
      translations.push({
        lang: langCode,
        value: value
      })
      processedLanguages.add(langCode)
    }
  }
  
  // From translation object
  if (props.value && typeof props.value === 'object' && 'original' in props.value) {
    const translationObj = props.value as Record<string, string>
    for (const [langCode] of Object.entries(SUPPORTED_LANGUAGES)) {
      if (translationObj[langCode] && langCode !== 'original' && !processedLanguages.has(langCode)) {
        translations.push({
          lang: langCode,
          value: translationObj[langCode]
        })
        processedLanguages.add(langCode)
      }
    }
  }
  
  // From external translations
  if (props.translations && props.translations[props.field]) {
    const fieldTranslations = props.translations[props.field]
    if (fieldTranslations) {
      for (const [langCode] of Object.entries(SUPPORTED_LANGUAGES)) {
        if (fieldTranslations[langCode] && !processedLanguages.has(langCode)) {
          translations.push({
            lang: langCode,
            value: fieldTranslations[langCode]
          })
          processedLanguages.add(langCode)
        }
      }
    }
  }
  
  return translations
})

// Helper function to check if a translation exists for a specific language
function hasTranslation(langCode: string): boolean {
  // First check local translations (immediate updates)
  if (localTranslations[langCode]) {
    return true
  }
  
  // If translations are provided externally, use them
  if (props.translations && props.translations[props.field]) {
    const fieldTranslations = props.translations[props.field]
    return !!(fieldTranslations && fieldTranslations[langCode])
  }
  
  // If the value is a translation object, check if it has this language
  if (props.value && typeof props.value === 'object' && 'original' in props.value) {
    const translationObj = props.value as Record<string, string>
    return !!(translationObj[langCode])
  }
  
  return false
}

// Helper function to get color for each language when translated
function getTranslatedColor(langCode: string): string {
  const colorMap: Record<string, string> = {
    'en': 'bg-blue-500 border-blue-600',      // English - Blue
    'de': 'bg-yellow-500 border-yellow-600',  // German - Yellow
    'fr': 'bg-purple-500 border-purple-600',  // French - Purple  
    'it': 'bg-green-500 border-green-600'     // Italian - Green
  }
  return colorMap[langCode] || 'bg-gray-500 border-gray-600'
}

// Computed to check if we can save translations (requires modelId and modelType)
const canSaveTranslations = computed(() => {
  return !!(props.modelId && props.modelType)
})

// Initialize editable translations when modal opens
function initializeEditableTranslations() {
  // Clear existing translations
  Object.keys(editableTranslations).forEach(key => {
    editableTranslations[key] = ''
  })

  // Populate with current translations
  if (props.value && typeof props.value === 'object' && 'original' in props.value) {
    const translationObj = props.value as Record<string, string>
    for (const langCode of Object.keys(SUPPORTED_LANGUAGES)) {
      if (translationObj[langCode]) {
        editableTranslations[langCode] = translationObj[langCode]
      }
    }
  }

  // From external translations
  if (props.translations && props.translations[props.field]) {
    const fieldTranslations = props.translations[props.field]
    for (const langCode of Object.keys(SUPPORTED_LANGUAGES)) {
      if (fieldTranslations?.[langCode]) {
        editableTranslations[langCode] = fieldTranslations[langCode]
      }
    }
  }
}

// Open translation modal
function editTranslation() {
  initializeEditableTranslations()
  showTranslationModal.value = true
}

// Close translation modal
function closeTranslationModal() {
  showTranslationModal.value = false
}

// Save translations
async function saveTranslations() {
  if (!canSaveTranslations.value || !props.modelId || !props.modelType) {
    console.warn('Cannot save translations: missing modelId or modelType')
    return
  }

  savingTranslations.value = true
  
  try {
    // Prepare translations object with only non-empty values
    const translationsToSave: Record<string, string> = {}
    for (const [langCode, value] of Object.entries(editableTranslations)) {
      if (value && value.trim()) {
        translationsToSave[langCode] = value.trim()
      }
    }


    // Use the new saveFieldTranslations method
    await saveFieldTranslations(
      props.modelType,
      props.modelId,
      props.field,
      translationsToSave
    )
    
    // Update local translations for immediate UI feedback
    Object.assign(localTranslations, translationsToSave)
    
    // Show success toast
    const toast = useToast()
    const savedCount = Object.keys(translationsToSave).length
    const languageText = savedCount === 1 ? 'language' : 'languages'
    
    toast.add({
      title: 'Translations Saved',
      description: `Successfully saved translations for ${savedCount} ${languageText}`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    
    // Emit the updated translations to parent components
    emit('translationsUpdated', props.field, translationsToSave)
    
    // Close modal
    closeTranslationModal()
  } catch (error) {
    console.error('Failed to save translations:', error)
    
    // Show error toast
    const toast = useToast()
    toast.add({
      title: 'Translation Error',
      description: 'Failed to save translations. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    savingTranslations.value = false
  }
}
</script>


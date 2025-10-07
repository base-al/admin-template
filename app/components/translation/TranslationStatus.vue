<template>
  <UPopover v-if="isTranslatableField" mode="hover" :popper="{ placement: 'top' }">
    <div class="inline-flex items-center ml-2">
      <!-- Language indicators -->
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
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslation, type SupportedLanguage, type TranslationField } from '@@/app/composables/useTranslation'

interface Props {
  field: string
  value: string | TranslationField | undefined
  modelId?: number
  modelType?: string
  translations?: Record<string, Record<string, string>>
}

const props = withDefaults(defineProps<Props>(), {
  modelId: undefined,
  modelType: undefined,
  translations: undefined
})

const { SUPPORTED_LANGUAGES } = useTranslation()

// Check if the field is translatable (has translation object structure)
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

// Helper function to check if a translation exists for a specific language
function hasTranslation(langCode: string): boolean {
  // If translations are provided externally, use them
  if (props.translations && props.translations[props.field]) {
    const fieldTranslations = props.translations[props.field]
    return !!(fieldTranslations && fieldTranslations[langCode])
  }
  
  // If the value is a translation object, check if it has this language
  if (props.value && typeof props.value === 'object' && 'original' in props.value) {
    const translationObj = props.value as any
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

// Expose the hasTranslation function for external use
defineExpose({
  hasTranslation
})
</script>
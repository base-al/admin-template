<template>
  <div class="language-selector">
    <!-- Dropdown version -->
    <div v-if="variant === 'dropdown'" class="relative">
      <UButton
        variant="outline"
        color="neutral"
        :size="size"
        trailing-icon="i-heroicons-chevron-down"
        @click="isOpen = !isOpen"
      >
        <span class="flex items-center">
          <span v-if="showFlags" class="flag-icon">
            {{ getFlagEmoji(currentLanguage) }}
          </span>
          <span :class="{ 'ml-2': showFlags }">
            {{ showFullNames ? getCurrentLanguageName : currentLanguage.toUpperCase() }}
          </span>
        </span>
      </UButton>
      
      <div
        v-if="isOpen"
        class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700"
        @click.stop
      >
        <button
          v-for="language in availableLanguages"
          :key="language"
          class="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          :class="{
            'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium': currentLanguage === language
          }"
          @click="selectLanguage(language)"
        >
          <span v-if="showFlags" class="flag-icon">
            {{ getFlagEmoji(language) }}
          </span>
          <span :class="{ 'ml-2': showFlags }">
            {{ getLanguageName(language) }}
          </span>
          <UIcon 
            v-if="currentLanguage === language" 
            name="i-heroicons-check"
            class="w-4 h-4 ml-auto text-primary-600 dark:text-primary-400" 
          />
        </button>
      </div>
    </div>
    
    <!-- Button group version -->
    <div v-else-if="variant === 'buttons'" class="flex">
      <UButton
        v-for="language in availableLanguages"
        :key="language"
        :variant="currentLanguage === language ? 'solid' : 'outline'"
        :color="currentLanguage === language ? 'primary' : 'neutral'"
        :size="size"
        class="first:rounded-r-none last:rounded-l-none first:border-r-0 last:border-l-0 not-first:not-last:rounded-none not-first:not-last:border-x-0"
        @click="selectLanguage(language)"
      >
        <span class="flex items-center">
          <span v-if="showFlags" class="flag-icon">
            {{ getFlagEmoji(language) }}
          </span>
          <span :class="{ 'ml-1': showFlags }">
            {{ showFullNames ? getLanguageName(language) : language.toUpperCase() }}
          </span>
        </span>
      </UButton>
    </div>
    
    <!-- Simple toggle version -->
    <UButton
      v-else-if="variant === 'toggle'"
      variant="outline"
      color="neutral"
      :size="size"
      :title="`Switch to ${getNextLanguageName()}`"
      trailing-icon="i-heroicons-arrow-path"
      @click="toggleLanguage"
    >
      <span class="flex items-center">
        <span v-if="showFlags" class="flag-icon">
          {{ getFlagEmoji(currentLanguage) }}
        </span>
        <span :class="{ 'ml-2': showFlags }">
          {{ showFullNames ? getCurrentLanguageName : currentLanguage.toUpperCase() }}
        </span>
      </span>
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTranslationState } from '@@/app/composables/useTranslation'
import type { SupportedLanguage } from '@@/app/composables/useTranslation'

interface Props {
  variant?: 'dropdown' | 'buttons' | 'toggle'
  size?: 'sm' | 'md' | 'lg'
  showFlags?: boolean
  showFullNames?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'dropdown',
  size: 'md',
  showFlags: true,
  showFullNames: false,
})

const emit = defineEmits<{
  (e: 'language-changed', language: SupportedLanguage): void
}>()

const { locale } = useI18n()

const {
  currentLanguage,
  availableLanguages,
  getCurrentLanguageName,
  setCurrentLanguage,
  toggleLanguage,
  getLanguageName
} = useTranslationState()

const isOpen = ref(false)

const flagEmojis: Record<SupportedLanguage, string> = {
  de: '🇩🇪',
  fr: '🇫🇷',
  it: '🇮🇹',
  en: '🇬🇧'
}

const getFlagEmoji = (language: SupportedLanguage): string => {
  return flagEmojis[language] || '🌐'
}

const getNextLanguageName = () => {
  const currentIndex = availableLanguages.value.indexOf(currentLanguage.value)
  const nextIndex = (currentIndex + 1) % availableLanguages.value.length
  const nextLanguage = availableLanguages.value[nextIndex] || 'de' // Safe fallback
  return getLanguageName(nextLanguage as SupportedLanguage)
}

const selectLanguage = (language: SupportedLanguage) => {
  setCurrentLanguage(language)
  emit('language-changed', language)
  isOpen.value = false
}

// Note: i18n locale and translation language are separate concerns
// i18n controls UI language (buttons, labels, etc.)
// Translation language controls which translated content to display

// Sync with i18n locale changes (but don't override initial state)
onMounted(() => {
  // Only sync if there's a significant difference
  if (locale.value && availableLanguages.value.includes(locale.value as SupportedLanguage) && 
      locale.value !== currentLanguage.value) {
    setCurrentLanguage(locale.value as SupportedLanguage)
  }
})

const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.language-selector')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.flag-icon {
  font-size: 1rem;
  line-height: 1;
}

.language-selector {
  position: relative;
  display: inline-block;
}
</style>
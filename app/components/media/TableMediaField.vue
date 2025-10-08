<template>
  <div class="flex items-center gap-2">
    <template v-if="mediaObject">
      <!-- Image Thumbnail -->
      <img
        v-if="mediaObject.type && mediaObject.type.includes('image') && mediaUrl"
        :src="mediaUrl"
        :alt="mediaObject.name || 'Image'"
        class="h-10 w-10 rounded object-cover"
      >

      <!-- File Icon -->
      <UIcon
        v-else-if="mediaObject.type"
        :name="getFileIcon(mediaObject.type)"
        class="h-5 w-5 text-gray-500"
      />

      <!-- Media Name/Type -->
      <div class="flex flex-col min-w-0">
        <span class="text-sm text-gray-900 dark:text-gray-100 truncate">{{ mediaObject.name }}</span>
        <span v-if="mediaObject.type" class="text-xs text-gray-500">{{ mediaObject.type }}</span>
      </div>

      <!-- External Link -->
      <UButton
        v-if="mediaUrl"
        icon="i-lucide-external-link"
        size="xs"
        variant="ghost"
        :to="mediaUrl"
        target="_blank"
      />
    </template>

    <!-- No Media -->
    <span v-else class="text-sm text-gray-400 dark:text-gray-600">-</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MediaFile {
  url: string
  name?: string
  size?: number
}

interface FullMedia {
  id?: number
  name: string
  type: string
  file?: MediaFile
}

interface SimplifiedMedia {
  type: string
  name: string
  url: string
}

interface Props {
  value?: FullMedia | SimplifiedMedia | null
}

const props = defineProps<Props>()

const mediaObject = computed(() => {
  if (!props.value) return null

  // If value is already a media object
  if (typeof props.value === 'object') {
    return props.value
  }

  return null
})

const mediaUrl = computed(() => {
  if (!mediaObject.value) return null

  // Simplified structure (list response)
  if ('url' in mediaObject.value) {
    return mediaObject.value.url
  }

  // Full structure (detail response)
  if ('file' in mediaObject.value && mediaObject.value.file?.url) {
    return mediaObject.value.file.url
  }

  return null
})

const getFileIcon = (type: string) => {
  const lowerType = type.toLowerCase()
  if (lowerType.includes('image')) return 'i-lucide-image'
  if (lowerType.includes('video')) return 'i-lucide-video'
  if (lowerType.includes('audio')) return 'i-lucide-music'
  if (lowerType.includes('document') || lowerType.includes('pdf')) return 'i-lucide-file-text'
  return 'i-lucide-file'
}
</script>

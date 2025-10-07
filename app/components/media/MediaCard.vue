<template>
  <UCard
    class="cursor-pointer hover:shadow-lg transition-shadow"
    @click="$emit('click', media)"
  >
    <div class="aspect-square flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
      <img
        v-if="media.file && isImage"
        :src="media.file.url"
        :alt="media.name"
        class="w-full h-full object-cover"
        @error="handleImageError"
      >
      <video
        v-else-if="media.file && isVideo"
        :src="media.file.url"
        class="w-full h-full object-cover"
        preload="metadata"
      >
        Your browser does not support video playback.
      </video>
      <div
        v-else-if="media.file && isAudio"
        class="w-full h-full flex items-center justify-center p-4"
      >
        <UIcon name="i-lucide-music" class="w-12 h-12 text-gray-400" />
      </div>
      <UIcon
        v-else
        :name="fileIcon"
        class="w-12 h-12 text-gray-400"
      />
    </div>
    <div class="mt-2 space-y-1">
      <p class="text-sm font-medium truncate">
        {{ media.name }}
      </p>
      <p class="text-xs text-gray-500">
        {{ media.type }}
      </p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MediaFile {
  url: string
  name: string
  size: number
}

interface Media {
  id: number
  name: string
  type: string
  description: string
  file?: MediaFile
  created_at: string
  updated_at: string
}

const props = defineProps<{
  media: Media
}>()

defineEmits<{
  click: [media: Media]
}>()

const isImage = computed(() => props.media.type.toLowerCase().includes('image'))
const isVideo = computed(() => props.media.type.toLowerCase().includes('video'))
const isAudio = computed(() => props.media.type.toLowerCase().includes('audio'))

const fileIcon = computed(() => {
  const lowerType = props.media.type.toLowerCase()
  if (lowerType.includes('image'))
    return 'i-lucide-image'
  if (lowerType.includes('video'))
    return 'i-lucide-video'
  if (lowerType.includes('audio'))
    return 'i-lucide-music'
  if (lowerType.includes('document') || lowerType.includes('pdf'))
    return 'i-lucide-file-text'
  return 'i-lucide-file'
})

// Handle HEIC images that fail to load
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  const url = props.media.file?.url.toLowerCase() || ''
  const name = props.media.name.toLowerCase()

  // If it's a HEIC file that failed to load, show fallback icon
  if (url.endsWith('.heic') || url.endsWith('.heif') || name.endsWith('.heic') || name.endsWith('.heif')) {
    // Replace image with icon (handled by parent)
    target.style.display = 'none'
  }
}
</script>

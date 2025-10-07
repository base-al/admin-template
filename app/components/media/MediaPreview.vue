<template>
  <div class="space-y-4">
    <!-- Tab selector if both files exist -->
    <UTabs v-if="hasBothFiles" v-model="selectedTab" :items="tabItems" />

    <!-- Preview area -->
    <div class="aspect-video flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
      <div v-if="currentFile && isImage && imageLoadError && isHeic" class="text-center p-4">
        <UIcon name="i-lucide-image" class="w-16 h-16 text-gray-400 mx-auto mb-2" />
        <p class="text-sm text-gray-600 dark:text-gray-400">
          HEIC/HEIF preview not supported in this browser
        </p>
        <p class="text-xs text-gray-500 mt-1">
          {{ media.name }}
        </p>
      </div>
      <img
        v-else-if="currentFile && isImage"
        :src="currentFile.url"
        :alt="media.name"
        class="max-w-full max-h-full object-contain"
        @error="imageLoadError = true"
      >
      <video
        v-else-if="currentFile && isVideo"
        :src="currentFile.url"
        class="max-w-full max-h-full"
        controls
        preload="metadata"
      >
        Your browser does not support video playback.
      </video>
      <div
        v-else-if="currentFile && isAudio"
        class="w-full flex flex-col items-center justify-center p-8 gap-4"
      >
        <UIcon name="i-lucide-music" class="w-24 h-24 text-gray-400" />
        <audio
          :src="currentFile.url"
          controls
          class="w-full max-w-md"
          preload="metadata"
        >
          Your browser does not support audio playback.
        </audio>
      </div>
      <UIcon
        v-else
        :name="fileIcon"
        class="w-24 h-24 text-gray-400"
      />
    </div>

    <!-- File info -->
    <div v-if="currentFile" class="text-xs text-gray-500 dark:text-gray-400 text-center">
      {{ formatFileSize(currentFile.size) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

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
  original_file?: MediaFile
  created_at: string
  updated_at: string
}

const props = defineProps<{
  media: Media
}>()

const imageLoadError = ref(false)
const selectedTab = ref(0)

const hasBothFiles = computed(() => !!(props.media.file && props.media.original_file))

const tabItems = computed(() => {
  if (!hasBothFiles.value)
    return []
  return [
    { label: 'Converted', value: 0 },
    { label: 'Original', value: 1 },
  ]
})

const currentFile = computed(() => {
  if (hasBothFiles.value) {
    return selectedTab.value === 0 ? props.media.file : props.media.original_file
  }
  return props.media.file || props.media.original_file
})

const isImage = computed(() => props.media.type.toLowerCase().includes('image'))
const isVideo = computed(() => props.media.type.toLowerCase().includes('video'))
const isAudio = computed(() => props.media.type.toLowerCase().includes('audio'))
const isHeic = computed(() => {
  const url = currentFile.value?.url.toLowerCase() || ''
  const name = props.media.name.toLowerCase()
  return url.endsWith('.heic') || url.endsWith('.heif') || name.endsWith('.heic') || name.endsWith('.heif')
})

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

function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round(bytes / k ** i * 100) / 100} ${sizes[i]}`
}
</script>

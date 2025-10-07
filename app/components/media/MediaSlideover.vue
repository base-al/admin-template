<template>
  <USlideover v-model:open="isOpen" :ui="{ content: 'max-w-2xl' }" title="Media Details" description="View details of the selected media file">
    <template #title>
      <div class="flex items-center justify-between">
        <span>Media Details</span>
        <div class="flex gap-2">
          <UButton
            v-if="media?.file"
            icon="i-lucide-download"
            variant="ghost"
            size="sm"
            title="Download converted file"
            @click="handleDownload('converted')"
          />
          <UButton
            v-if="media?.original_file"
            icon="i-lucide-download"
            variant="ghost"
            size="sm"
            color="primary"
            title="Download original file"
            @click="handleDownload('original')"
          />
          <CommonPermissionButton
            permission="media:delete"
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            size="sm"
            :loading="deleting"
            @click="$emit('delete', media)"
          />
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="media" class="space-y-6 p-4">
        <!-- Preview -->
        <MediaPreview :media="media" />

        <!-- Media Details -->
        <div class="space-y-4">
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400">Name</label>
            <p class="text-base font-medium">
              {{ media.name }}
            </p>
          </div>

          <div v-if="media.description">
            <label class="text-sm text-gray-600 dark:text-gray-400">Description</label>
            <p class="text-base font-medium">
              {{ media.description }}
            </p>
          </div>

          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400">Type</label>
            <p class="text-base font-medium">
              {{ media.type }}
            </p>
          </div>

          <!-- File Sizes -->
          <div v-if="media.file || media.original_file" class="space-y-2">
            <label class="text-sm text-gray-600 dark:text-gray-400">File Size</label>
            <div v-if="media.file" class="flex justify-between items-center">
              <span class="text-sm">Converted:</span>
              <span class="text-base font-medium">{{ formatFileSize(media.file.size) }}</span>
            </div>
            <div v-if="media.original_file" class="flex justify-between items-center">
              <span class="text-sm">Original:</span>
              <span class="text-base font-medium">{{ formatFileSize(media.original_file.size) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-600 dark:text-gray-400">Created</label>
              <p class="text-base font-medium">
                {{ formatDateTime(media.created_at) }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-600 dark:text-gray-400">Updated</label>
              <p class="text-base font-medium">
                {{ formatDateTime(media.updated_at) }}
              </p>
            </div>
          </div>

          <!-- File URLs -->
          <div v-if="media.file" class="border-t dark:border-gray-700 pt-4 space-y-3">
            <div>
              <label class="text-sm text-gray-600 dark:text-gray-400">Converted File URL</label>
              <div class="flex gap-2 mt-1">
                <UInput
                  :model-value="media.file.url"
                  readonly
                  class="flex-1"
                />
                <UButton
                  icon="i-lucide-copy"
                  variant="outline"
                  @click="handleCopy('converted')"
                />
              </div>
            </div>
            <div v-if="media.original_file">
              <label class="text-sm text-gray-600 dark:text-gray-400">Original File URL</label>
              <div class="flex gap-2 mt-1">
                <UInput
                  :model-value="media.original_file.url"
                  readonly
                  class="flex-1"
                />
                <UButton
                  icon="i-lucide-copy"
                  variant="outline"
                  @click="handleCopy('original')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
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
  original_file?: MediaFile
  created_at: string
  updated_at: string
}

const props = defineProps<{
  modelValue: boolean
  media: Media | null
  deleting: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'delete': [media: Media | null]
  'download': [media: Media | null, fileType: 'converted' | 'original']
  'copy': [url: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const handleDownload = (fileType: 'converted' | 'original') => {
  emit('download', props.media, fileType)
}

const handleCopy = (fileType: 'converted' | 'original') => {
  const url = fileType === 'converted' ? props.media?.file?.url : props.media?.original_file?.url
  if (url) {
    emit('copy', url)
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}
</script>

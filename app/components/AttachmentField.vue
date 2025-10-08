<template>
  <UFormField :label="label" :required="required">
    <!-- Preview and Upload Area -->
    <div class="space-y-3">
      <!-- File Preview -->
      <div
        v-if="previewUrl || selectedFile"
        class="relative border rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
      >
        <div class="flex items-center gap-3">
          <!-- Image Preview -->
          <div
            v-if="isImage"
            class="w-20 h-20 flex items-center justify-center bg-white dark:bg-gray-700 rounded overflow-hidden"
          >
            <img
              v-if="previewUrl"
              :src="previewUrl"
              :alt="selectedFile?.name || 'Preview'"
              class="w-full h-full object-cover"
            >
          </div>

          <!-- File Icon for non-images -->
          <div
            v-else
            class="w-20 h-20 flex items-center justify-center bg-white dark:bg-gray-700 rounded"
          >
            <UIcon :name="getFileIcon(selectedFile?.type || '')" class="w-8 h-8 text-gray-400" />
          </div>

          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">
              {{ selectedFile?.name || 'Current file' }}
            </p>
            <p v-if="selectedFile" class="text-xs text-gray-500">
              {{ formatFileSize(selectedFile.size) }}
            </p>
            <p v-if="uploading" class="text-xs text-primary-500 mt-1">
              Uploading...
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-1">
            <UButton
              v-if="previewUrl && !uploading"
              size="sm"
              variant="ghost"
              icon="i-lucide-eye"
              @click="viewFile"
            />
            <UButton
              v-if="!uploading"
              size="sm"
              variant="ghost"
              icon="i-lucide-trash-2"
              color="error"
              @click="clearFile"
            />
          </div>
        </div>
      </div>

      <!-- Upload Button / Drag Drop Area -->
      <div
        class="border-2 border-dashed rounded-lg p-4 text-center transition-colors"
        :class="{
          'border-gray-300 dark:border-gray-600 hover:border-primary-500': !isDragging,
          'border-primary-500 bg-primary-50 dark:bg-primary-900/20': isDragging,
        }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          :accept="accept"
          class="hidden"
          @change="handleFileSelect"
        >

        <UIcon name="i-lucide-upload" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {{ selectedFile ? 'Choose a different file' : 'Drop file here or click to browse' }}
        </p>
        <UButton size="sm" variant="outline" @click="fileInput?.click()">
          {{ selectedFile ? 'Change File' : 'Browse Files' }}
        </UButton>
      </div>

      <!-- Accept types hint -->
      <p v-if="accept" class="text-xs text-gray-500">
        Accepted types: {{ accept }}
      </p>
    </div>
  </UFormField>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue?: string | null
  label?: string
  required?: boolean
  accept?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: 'File',
  required: false,
  accept: '*/*',
  name: 'file',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(props.modelValue || null)
const isDragging = ref(false)
const uploading = ref(false)

const toast = useToast()

// Computed
const isImage = computed(() => {
  if (selectedFile.value) {
    return selectedFile.value.type.startsWith('image/')
  }
  if (previewUrl.value) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(previewUrl.value)
  }
  return false
})

// Methods
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    setFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files[0]) {
    setFile(files[0])
  }
}

const setFile = async (file: File) => {
  selectedFile.value = file

  // Create preview URL for images
  if (file.type.startsWith('image/')) {
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl.value)
    }
    previewUrl.value = URL.createObjectURL(file)
  }

  // Auto-upload
  await uploadFile(file)
}

const uploadFile = async (file: File) => {
  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)

    // Use $fetch directly for file uploads
    const config = useRuntimeConfig()
    const baseURL = import.meta.dev ? '/api' : config.public.apiBase || 'http://localhost:8200/api'
    const token = useCookie<string | null>('auth_token')

    const response = await $fetch<{ url: string }>(`${baseURL}/storage/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'X-API-Key': config.public.apiKey || 'api',
        ...(token.value && { Authorization: `Bearer ${token.value}` }),
      },
    })

    // Update preview URL with uploaded file URL
    previewUrl.value = response.url
    emit('update:modelValue', response.url)

    toast.add({
      title: 'Success',
      description: 'File uploaded successfully',
      color: 'success',
    })
  } catch (error) {
    let errorMessage = 'Failed to upload file'
    if (error && typeof error === 'object' && 'data' in error) {
      const errorData = error.data as { error?: string }
      if (errorData.error) {
        errorMessage = errorData.error
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    toast.add({
      title: 'Upload Failed',
      description: errorMessage,
      color: 'error',
    })

    // Clear failed upload
    selectedFile.value = null
  } finally {
    uploading.value = false
  }
}

const clearFile = () => {
  selectedFile.value = null
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  emit('update:modelValue', null)

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const viewFile = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
  }
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'i-lucide-image'
  if (mimeType.startsWith('video/')) return 'i-lucide-video'
  if (mimeType.startsWith('audio/')) return 'i-lucide-music'
  if (mimeType.includes('pdf')) return 'i-lucide-file-text'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'i-lucide-file-text'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'i-lucide-table'
  return 'i-lucide-file'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Watch for external URL changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue !== previewUrl.value) {
      previewUrl.value = newValue
    }
  }
)
</script>

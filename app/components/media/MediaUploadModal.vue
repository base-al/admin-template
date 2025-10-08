<template>
  <UModal
v-model:open="isOpen" 
  title="Upload Media"
  description="Upload a new media file to the library"
  >
    <template #header>
      Upload Media
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- Drag & Drop Area -->
        <div
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-colors"
          :class="{
            'border-primary-500 bg-primary-50 dark:bg-primary-900/20': isDragging
          }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInput"
            type="file"
            accept="*/*"
            class="hidden"
            @change="handleFileSelect"
          >

          <div v-if="!uploadForm.file">
            <UIcon name="i-lucide-upload-cloud" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop your file here, or
            </p>
            <UButton
              variant="outline"
              @click="fileInput?.click()"
            >
              Browse Files
            </UButton>
          </div>

          <div v-else class="space-y-2">
            <UIcon :name="getFileIcon(uploadForm.file.type)" class="w-12 h-12 text-primary-500 mx-auto" />
            <p class="text-sm font-medium">{{ uploadForm.file.name }}</p>
            <p class="text-xs text-gray-500">{{ formatFileSize(uploadForm.file.size) }}</p>
            <UButton
              size="sm"
              variant="ghost"
              icon="i-lucide-x"
              @click="clearFile"
            >
              Remove
            </UButton>
          </div>
        </div>

        <UFormField label="Name" required>
          <UInput v-model="uploadForm.name" placeholder="Enter file name" />
        </UFormField>

        <UFormField label="Type" required>
          <USelect
            v-model="uploadForm.type"
            :items="[
              { label: 'Image', value: 'image' },
              { label: 'Document', value: 'document' },
              { label: 'Audio', value: 'audio' },
              { label: 'Video', value: 'video' },
              { label: 'Other', value: 'other' },
            ]"
            placeholder="Select file type"
          />
        </UFormField>

        <UFormField label="Description">
          <UTextarea v-model="uploadForm.description" placeholder="Optional description" :rows="3" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          @click="handleClose"
        >
          Cancel
        </UButton>
        <UButton
          :loading="uploading"
          :disabled="!uploadForm.file || !uploadForm.name || !uploadForm.type"
          @click="handleUpload"
        >
          Upload
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

interface Props {
  modelValue: boolean
  parentId?: number | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'uploaded', media: unknown): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toast = useToast()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const uploading = ref(false)

const uploadForm = reactive({
  file: null as File | null,
  name: '',
  type: '',
  description: ''
})

const isOpen = computed({
  get: () => {
    console.log('MediaUploadModal isOpen get:', props.modelValue)
    return props.modelValue
  },
  set: (value) => {
    console.log('MediaUploadModal isOpen set:', value)
    emit('update:modelValue', value)
  }
})

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

const setFile = (file: File) => {
  uploadForm.file = file
  if (!uploadForm.name) {
    uploadForm.name = file.name
  }
  // Auto-detect type
  if (!uploadForm.type) {
    const mimeType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()

    // Check for HEIC/HEIF by extension if MIME type is not set
    if (mimeType.startsWith('image/') || fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      uploadForm.type = 'image'
    }
    else if (mimeType.startsWith('audio/')) uploadForm.type = 'audio'
    else if (mimeType.startsWith('video/')) uploadForm.type = 'video'
    else if (mimeType.includes('pdf') || mimeType.includes('document')) uploadForm.type = 'document'
    else uploadForm.type = 'other'
  }
}

const clearFile = () => {
  uploadForm.file = null
  uploadForm.name = ''
  uploadForm.type = ''
  uploadForm.description = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleClose = () => {
  isOpen.value = false
  clearFile()
}

const handleUpload = async () => {
  if (!uploadForm.file) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.file)
    formData.append('name', uploadForm.name)
    formData.append('type', uploadForm.type)
    if (uploadForm.description) {
      formData.append('description', uploadForm.description)
    }
    if (props.parentId) {
      formData.append('parent_id', props.parentId.toString())
    }

    // Use $fetch directly for file uploads to avoid JSON Content-Type header
    const config = useRuntimeConfig()
    const baseURL = import.meta.dev ? '/api' : config.public.apiBase || 'http://localhost:8200/api'
    const token = useCookie<string | null>('auth_token')

    const media = await $fetch(`${baseURL}/media`, {
      method: 'POST',
      body: formData,
      headers: {
        'X-API-Key': config.public.apiKey || 'api',
        ...(token.value && { Authorization: `Bearer ${token.value}` })
      }
    })

    toast.add({
      title: 'Success',
      description: 'File uploaded successfully',
      color: 'success',
    })

    emit('uploaded', media)
    handleClose()
  } catch (error) {
    // Extract error message from API response
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
  } finally {
    uploading.value = false
  }
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'i-lucide-image'
  if (mimeType.startsWith('video/')) return 'i-lucide-video'
  if (mimeType.startsWith('audio/')) return 'i-lucide-music'
  if (mimeType.includes('pdf') || mimeType.includes('document')) return 'i-lucide-file-text'
  return 'i-lucide-file'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

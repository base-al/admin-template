<template>
  <UFormField :label="label" :required="required" :help="help">
    <!-- Hidden input for form submission -->
    <input
      type="hidden"
      :name="name"
      :value="modelValue || ''"
    >

    <!-- Media Preview -->
    <div class="space-y-2">
      <div
        v-if="selectedMedia"
        class="relative border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        @click="showPicker = true"
      >
        <div class="flex items-center gap-3">
          <!-- Thumbnail -->
          <div class="w-16 h-16 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
            <img
              v-if="selectedMedia.file && isImage(selectedMedia.type)"
              :src="selectedMedia.file.url"
              :alt="selectedMedia.name"
              class="w-full h-full object-cover"
            >
            <UIcon
              v-else
              :name="getFileIcon(selectedMedia.type)"
              class="w-8 h-8 text-gray-400"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ selectedMedia.name }}</p>
            <p class="text-xs text-gray-500">{{ selectedMedia.type }}</p>
            <p v-if="selectedMedia.file" class="text-xs text-gray-400">
              {{ selectedMedia.file.url }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-1">
            <UButton
              size="sm"
              variant="ghost"
              icon="i-lucide-eye"
              @click.stop="handleView"
            />
            <UButton
              size="sm"
              variant="ghost"
              icon="i-lucide-x"
              color="error"
              @click.stop="handleClear"
            />
          </div>
        </div>
      </div>

      <!-- Select Button -->
      <div
        v-else
        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        @click="showPicker = true"
      >
        <UIcon name="i-lucide-image" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p class="text-sm text-gray-500 mb-2">No media selected</p>
        <p class="text-xs text-gray-400">Click to select media</p>
      </div>
    </div>

    <!-- Media Picker Modal -->
    <MediaPickerModal
      v-model="showPicker"
      :accept="accept"
      @select="handleSelect"
    />

    <!-- Media Upload Modal -->
    <MediaUploadModal
      v-if="allowUpload"
      v-model="showUpload"
      @uploaded="handleUploaded"
    />

    <!-- Preview Modal -->
    <UModal v-model:open="showPreview" :ui="{ width: 'sm:max-w-2xl' }">
      <template #header>
        Media Preview
      </template>

      <template #body>
        <div v-if="selectedMedia" class="space-y-4">
          <!-- Preview -->
          <div class="aspect-video flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
            <img
              v-if="selectedMedia.file && isImage(selectedMedia.type)"
              :src="selectedMedia.file.url"
              :alt="selectedMedia.name"
              class="max-w-full max-h-full object-contain"
            >
            <UIcon
              v-else
              :name="getFileIcon(selectedMedia.type)"
              class="w-24 h-24 text-gray-400"
            />
          </div>

          <!-- Info -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-600 dark:text-gray-400">Name</label>
              <p class="text-base font-medium">{{ selectedMedia.name }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-600 dark:text-gray-400">Type</label>
              <p class="text-base font-medium">{{ selectedMedia.type }}</p>
            </div>
            <div v-if="selectedMedia.file" class="col-span-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">URL</label>
              <p class="text-base font-medium break-all">{{ selectedMedia.file.url }}</p>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end">
          <UButton @click="showPreview = false">Close</UButton>
        </div>
      </template>
    </UModal>
  </UFormField>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

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

interface Props {
  modelValue: number | null | undefined
  label?: string
  name?: string
  required?: boolean
  help?: string
  accept?: string // Filter by type: 'image', 'document', 'audio', 'video'
  allowUpload?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: number | null): void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Media',
  name: 'media_id',
  required: false,
  help: '',
  accept: undefined,
  allowUpload: true
})

const emit = defineEmits<Emits>()

const api = useApi()
const selectedMedia = ref<Media | null>(null)
const showPicker = ref(false)
const showUpload = ref(false)
const showPreview = ref(false)

// Fetch media details when modelValue changes
watch(() => props.modelValue, async (newValue) => {
  if (newValue && newValue !== selectedMedia.value?.id) {
    await fetchMedia(newValue)
  } else if (!newValue) {
    selectedMedia.value = null
  }
}, { immediate: true })

const fetchMedia = async (id: number) => {
  try {
    const media = await api.get<Media>(`/media/${id}`)
    selectedMedia.value = media
  } catch (error) {
    console.error('Failed to fetch media:', error)
    selectedMedia.value = null
  }
}

const handleSelect = (media: Media) => {
  selectedMedia.value = media
  emit('update:modelValue', media.id)
}

const handleUploaded = (media: Media) => {
  selectedMedia.value = media
  emit('update:modelValue', media.id)
}

const handleClear = () => {
  selectedMedia.value = null
  emit('update:modelValue', null)
}

const handleView = () => {
  showPreview.value = true
}

const isImage = (type: string) => {
  return type.toLowerCase().includes('image')
}

const getFileIcon = (type: string) => {
  const lowerType = type.toLowerCase()
  if (lowerType.includes('image')) return 'i-lucide-image'
  if (lowerType.includes('video')) return 'i-lucide-video'
  if (lowerType.includes('audio')) return 'i-lucide-music'
  if (lowerType.includes('document') || lowerType.includes('pdf')) return 'i-lucide-file-text'
  return 'i-lucide-file'
}

// Load initial media if modelValue is provided
onMounted(() => {
  if (props.modelValue) {
    fetchMedia(props.modelValue)
  }
})
</script>

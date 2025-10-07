<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-4xl' }">
    <template #header>
      <div class="flex items-center justify-between">
        <span>Select Media</span>
        <UButton
          icon="i-lucide-upload"
          size="sm"
          @click="showUploadModal = true"
        >
          Upload New
        </UButton>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- Search and Filters -->
        <div class="flex items-center gap-2">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search media..."
            class="flex-1"
            @update:model-value="handleSearch"
          />
          <USelect
            v-model="selectedType"
            :items="typeOptions"
            placeholder="All types"
            class="min-w-32"
            @update:model-value="handleFilter"
          />
        </div>

        <!-- Media Grid -->
        <div v-if="!loading && mediaItems.length > 0" class="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
          <div
            v-for="item in mediaItems"
            :key="item.id"
            class="cursor-pointer border-2 rounded-lg p-2 transition-all hover:shadow-md"
            :class="{
              'border-primary-500 bg-primary-50 dark:bg-primary-900/20': selectedMedia?.id === item.id,
              'border-gray-200 dark:border-gray-700': selectedMedia?.id !== item.id
            }"
            @click="selectedMedia = item"
          >
            <div class="aspect-square flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded overflow-hidden mb-2">
              <img
                v-if="item.file && isImage(item.type)"
                :src="item.file.url"
                :alt="item.name"
                class="w-full h-full object-cover"
              >
              <UIcon
                v-else
                :name="getFileIcon(item.type)"
                class="w-8 h-8 text-gray-400"
              />
            </div>
            <p class="text-xs font-medium truncate">{{ item.name }}</p>
            <p class="text-xs text-gray-500">{{ item.type }}</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading && mediaItems.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-image" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-sm text-gray-500 mb-2">No media files found</p>
          <UButton size="sm" @click="showUploadModal = true">Upload File</UButton>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>

        <!-- Pagination -->
        <div v-if="pagination.total > pagination.limit" class="flex justify-center pt-2">
          <UPagination
            v-model="pagination.page"
            :total="pagination.total"
            :items-per-page="pagination.limit"
            @update:model-value="fetchMedia"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between items-center">
        <div v-if="selectedMedia" class="text-sm text-gray-600 dark:text-gray-400">
          Selected: {{ selectedMedia.name }}
        </div>
        <div v-else />
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            @click="handleClose"
          >
            Cancel
          </UButton>
          <UButton
            :disabled="!selectedMedia"
            @click="handleSelect"
          >
            Select
          </UButton>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Upload Modal -->
  <MediaUploadModal
    v-model="showUploadModal"
    @uploaded="handleUploaded"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

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
  modelValue: boolean
  accept?: string // Filter by type: 'image', 'document', 'audio', 'video'
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', media: Media): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const api = useApi()
const toast = useToast()

const loading = ref(false)
const mediaItems = ref<Media[]>([])
const selectedMedia = ref<Media | null>(null)
const searchQuery = ref('')
const selectedType = ref('all')
const showUploadModal = ref(false)

const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0
})

const typeOptions = [
  { label: 'All types', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'Documents', value: 'document' },
  { label: 'Audio', value: 'audio' },
  { label: 'Video', value: 'video' },
  { label: 'Other', value: 'other' },
]

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Reset selection when opened
    selectedMedia.value = null
    // Apply accept filter if provided
    if (props.accept) {
      selectedType.value = props.accept
    }
    fetchMedia()
  }
})

const fetchMedia = async () => {
  loading.value = true
  try {
    const response = await api.get<{ data: Media[], pagination: any }>('/media', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchQuery.value && { search: searchQuery.value }),
        ...(selectedType.value !== 'all' && { type: selectedType.value }),
      }
    })

    mediaItems.value = response.data
    if (response.pagination) {
      pagination.total = response.pagination.total
    }
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to fetch media',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchMedia()
}

const handleFilter = () => {
  pagination.page = 1
  fetchMedia()
}

const handleSelect = () => {
  if (selectedMedia.value) {
    emit('select', selectedMedia.value)
    handleClose()
  }
}

const handleClose = () => {
  isOpen.value = false
  selectedMedia.value = null
}

const handleUploaded = (media: Media) => {
  // Refresh media list after upload
  fetchMedia()
  // Auto-select the newly uploaded media
  selectedMedia.value = media
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
</script>

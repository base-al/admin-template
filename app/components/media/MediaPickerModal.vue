<template>
  <UModal v-model:open="isOpen" fullscreen>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex-1">
          <h2 class="text-lg font-semibold">Select Media</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Choose a file from your media library</p>
          <!-- Breadcrumb Navigation -->
          <nav class="flex items-center gap-1 text-sm mt-1" aria-label="Breadcrumb">
            <button
              class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              @click="navigateToFolder(null)"
            >
              <UIcon name="i-lucide-home" class="w-4 h-4" />
            </button>
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
              <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-gray-400" />
              <button
                class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                :class="{ 'font-medium text-gray-900 dark:text-gray-100': index === breadcrumbs.length - 1 }"
                @click="navigateToFolder(crumb.id)"
              >
                {{ crumb.name }}
              </button>
            </template>
          </nav>
        </div>
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
      <div class="space-y-4 h-full flex flex-col">
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
          <UButton
            icon="i-lucide-folder-plus"
            variant="outline"
            @click="showCreateFolder = true"
          >
            New Folder
          </UButton>
        </div>

        <!-- Media Grid -->
        <div v-if="!loading && (folders.length > 0 || files.length > 0)" class="grid grid-cols-6 gap-3 overflow-y-auto max-h-[500px]">
          <!-- Folders First -->
          <div
            v-for="folder in folders"
            :key="`folder-${folder.id}`"
            class="cursor-pointer border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
            @click="navigateToFolder(folder.id)"
          >
            <div class="aspect-square flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded mb-2">
              <UIcon name="i-lucide-folder" class="w-12 h-12 text-amber-500" />
            </div>
            <p class="text-xs font-medium truncate text-center">{{ folder.name }}</p>
          </div>

          <!-- Files -->
          <div
            v-for="file in files"
            :key="`file-${file.id}`"
            class="cursor-pointer border-2 rounded-lg p-2 transition-all hover:shadow-md"
            :class="{
              'border-primary-500 bg-primary-50 dark:bg-primary-900/20': selectedMedia?.id === file.id,
              'border-gray-200 dark:border-gray-700': selectedMedia?.id !== file.id
            }"
            @click="selectedMedia = file"
          >
            <div class="aspect-square flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded overflow-hidden mb-2">
              <img
                v-if="file.file && isImage(file.type)"
                :src="file.file.url"
                :alt="file.name"
                class="w-full h-full object-cover"
              >
              <UIcon
                v-else
                :name="getFileIcon(file.type)"
                class="w-8 h-8 text-gray-400"
              />
            </div>
            <p class="text-xs font-medium truncate">{{ file.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ file.type }}</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading && folders.length === 0 && files.length === 0" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <UIcon name="i-lucide-folder-open" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p class="text-sm text-gray-500 mb-2">No files or folders in this directory</p>
            <div class="flex gap-2 justify-center">
              <UButton size="sm" variant="outline" @click="showCreateFolder = true">
                <UIcon name="i-lucide-folder-plus" class="w-4 h-4 mr-1" />
                New Folder
              </UButton>
              <UButton size="sm" @click="showUploadModal = true">
                <UIcon name="i-lucide-upload" class="w-4 h-4 mr-1" />
                Upload File
              </UButton>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
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

  <!-- Create Folder Modal -->
  <UModal v-model:open="showCreateFolder">
    <template #header>
      <div>
        <h3 class="text-lg font-semibold">Create New Folder</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Organize your media files into folders</p>
      </div>
    </template>
    <template #body>
      <UFormField label="Folder Name" required>
        <UInput
          v-model="newFolderName"
          placeholder="Enter folder name"
          @keyup.enter="handleCreateFolder"
        />
      </UFormField>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          @click="showCreateFolder = false"
        >
          Cancel
        </UButton>
        <UButton
          :disabled="!newFolderName"
          :loading="creatingFolder"
          @click="handleCreateFolder"
        >
          Create
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Upload Modal -->
  <MediaUploadModal
    v-model="showUploadModal"
    :parent-id="currentFolderId"
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
  parent_id?: number | null
  file?: MediaFile
  created_at: string
  updated_at: string
}

interface Breadcrumb {
  id: number
  name: string
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
const showCreateFolder = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)
const currentFolderId = ref<number | null>(null)
const breadcrumbs = ref<Breadcrumb[]>([])

const pagination = reactive({
  page: 1,
  limit: 24,
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

// Separate folders and files
// Folders have type='folder' and no file attachment
const folders = computed(() => mediaItems.value.filter(item => item.type === 'folder' || !item.file))
const files = computed(() => mediaItems.value.filter(item => item.type !== 'folder' && item.file))

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Reset selection when opened
    selectedMedia.value = null
    currentFolderId.value = null
    breadcrumbs.value = []
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
    const params: Record<string, string | number> = {
      page: pagination.page,
      limit: pagination.limit,
    }

    // Add search if provided
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    // Add type filter if not 'all'
    // Backend automatically includes folders for navigation
    if (selectedType.value !== 'all') {
      params.type = selectedType.value
    }

    // Handle parent_id for folder navigation
    // Only send parent_id when inside a folder (not null)
    // When null, backend returns root items (where parent_id IS NULL)
    if (currentFolderId.value !== null) {
      params.parent_id = currentFolderId.value
    }

    const response = await api.get<{ data: Media[], pagination: { total: number } }>('/media', { params })

    mediaItems.value = response.data
    if (response.pagination) {
      pagination.total = response.pagination.total
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to fetch media',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

const navigateToFolder = async (folderId: number | null) => {
  currentFolderId.value = folderId

  if (folderId === null) {
    // Navigate to root
    breadcrumbs.value = []
  } else {
    // Update breadcrumbs
    const folderIndex = breadcrumbs.value.findIndex(b => b.id === folderId)
    if (folderIndex >= 0) {
      // Navigate back to a previous folder
      breadcrumbs.value = breadcrumbs.value.slice(0, folderIndex + 1)
    } else {
      // Navigate into a new folder
      const folder = mediaItems.value.find(item => item.id === folderId)
      if (folder) {
        breadcrumbs.value.push({ id: folder.id, name: folder.name })
      }
    }
  }

  pagination.page = 1
  await fetchMedia()
}

const handleCreateFolder = async () => {
  if (!newFolderName.value) return

  creatingFolder.value = true
  try {
    await api.post('/media', {
      name: newFolderName.value,
      type: 'folder',
      parent_id: currentFolderId.value,
    })

    toast.add({
      title: 'Success',
      description: 'Folder created successfully',
      color: 'success',
    })

    newFolderName.value = ''
    showCreateFolder.value = false
    await fetchMedia()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to create folder',
      color: 'error',
    })
  } finally {
    creatingFolder.value = false
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

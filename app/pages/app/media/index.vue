<template>
  <UDashboardPanel>
    <template #body>
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Media Library</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Manage files and media assets
            </p>
          </div>

          <div class="flex gap-2">
            <CommonPermissionButton
              permission="media:create"
              icon="i-lucide-upload"
              @click="handleOpenUpload"
            >
              Upload File
            </CommonPermissionButton>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Search -->
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search media..."
            class="max-w-sm"
            @update:model-value="handleSearch"
          />

          <div class="flex items-center gap-2">
            <!-- Type Filter -->
            <USelect
              v-model="selectedType"
              :items="typeOptions"
              placeholder="All types"
              class="min-w-32"
              @update:model-value="handleFilter"
            />

            <!-- View Toggle -->
            <UButton
              :icon="viewMode === 'grid' ? 'i-lucide-list' : 'i-lucide-grid'"
              variant="outline"
              @click="toggleViewMode"
            />
          </div>
        </div>

        <!-- Grid View -->
        <div v-if="viewMode === 'grid' && !loading && mediaItems.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <UCard
            v-for="item in mediaItems"
            :key="item.id"
            class="cursor-pointer hover:shadow-lg transition-shadow"
            @click="handleView(item)"
            @contextmenu.prevent="(e: MouseEvent) => showContextMenu(e, item)"
          >
            <div class="aspect-square flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img
                v-if="item.file && isImage(item.type)"
                :src="item.file.url"
                :alt="item.name"
                class="w-full h-full object-cover"
              >
              <UIcon
                v-else
                :name="getFileIcon(item.type)"
                class="w-12 h-12 text-gray-400"
              />
            </div>
            <div class="mt-2 space-y-1">
              <p class="text-sm font-medium truncate">{{ item.name }}</p>
              <p class="text-xs text-gray-500">{{ item.type }}</p>
            </div>
          </UCard>
        </div>

        <!-- List View -->
        <UCard v-else-if="viewMode === 'list' && !loading && mediaItems.length > 0">
          <BaseTable
            :data="mediaItems"
            :columns="columns"
            :loading="loading"
            table-name="Media"
            search-column="name"
            search-placeholder="Search media..."
            :pagination="{
              current_page: pagination.page,
              per_page: pagination.limit,
              total: pagination.total
            }"
            :context-menu-items="getContextMenuItems"
            :on-row-click="handleView"
            @page-change="handlePageChange"
            @per-page-change="handlePerPageChange"
          />
        </UCard>

        <!-- Empty State -->
        <div v-if="!loading && mediaItems.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-image" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No media files</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            Upload your first file to get started
          </p>
          <CommonPermissionButton permission="media:create" @click="handleOpenUpload">Upload File</CommonPermissionButton>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
        </div>

        <!-- Upload Modal -->
        <MediaUploadModal
          v-model="showUploadModal"
          @uploaded="handleUploaded"
        />

        <!-- Detail Modal -->
        <UModal v-model="showDetailModal" :ui="{ content: 'sm:max-w-2xl' }">
          <template #header>
            Media Details
          </template>

          <template #body>
            <div v-if="selectedItem" class="space-y-4">
              <!-- Preview -->
              <div class="aspect-video flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  v-if="selectedItem.file && isImage(selectedItem.type)"
                  :src="selectedItem.file.url"
                  :alt="selectedItem.name"
                  class="max-w-full max-h-full object-contain"
                >
                <UIcon
                  v-else
                  :name="getFileIcon(selectedItem.type)"
                  class="w-24 h-24 text-gray-400"
                />
              </div>

              <!-- Info -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">Name</label>
                  <p class="text-base font-medium">{{ selectedItem.name }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">Type</label>
                  <p class="text-base font-medium">{{ selectedItem.type }}</p>
                </div>
                <div v-if="selectedItem.file" class="col-span-2">
                  <label class="text-sm text-gray-600 dark:text-gray-400">File URL</label>
                  <p class="text-base font-medium break-all">{{ selectedItem.file.url }}</p>
                </div>
                <div v-if="selectedItem.description" class="col-span-2">
                  <label class="text-sm text-gray-600 dark:text-gray-400">Description</label>
                  <p class="text-base font-medium">{{ selectedItem.description }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">Created</label>
                  <p class="text-base font-medium">{{ formatDateTime(selectedItem.created_at) }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">Updated</label>
                  <p class="text-base font-medium">{{ formatDateTime(selectedItem.updated_at) }}</p>
                </div>
              </div>
            </div>
          </template>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                color="neutral"
                variant="outline"
                @click="showDetailModal = false"
              >
                Close
              </UButton>
              <CommonPermissionButton
                permission="media:delete"
                color="error"
                variant="outline"
                :loading="deleting"
                @click="handleDelete(selectedItem)"
              >
                Delete
              </CommonPermissionButton>
            </div>
          </template>
        </UModal>

        <!-- Delete Confirmation Modal -->
        <CommonConfirmationModal
          v-model="showDeleteModal"
          title="Delete Media"
          message="Are you sure you want to delete this media file? This action cannot be undone."
          confirm-text="Delete"
          confirm-color="error"
          :loading="deleting"
          @confirm="confirmDelete"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { TableColumn, ContextMenuItem } from '@nuxt/ui'

definePageMeta({
  layout: 'default',
})

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

const toast = useToast()
const api = useApi()

// State
const mediaItems = ref<Media[]>([])
const loading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const selectedType = ref('all')
const showUploadModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref<Media | null>(null)
const deleting = ref(false)

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// Type filter options
const typeOptions = [
  { label: 'All types', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'Documents', value: 'document' },
  { label: 'Audio', value: 'audio' },
  { label: 'Video', value: 'video' },
  { label: 'Other', value: 'other' },
]

// Table columns
const columns: TableColumn<Media>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
  },
]

// Context menu
const getContextMenuItems = (row: Media): ContextMenuItem[] => [
  {
    label: 'View Details',
    icon: 'i-lucide-eye',
    click: () => handleView(row),
  },
  {
    label: 'Download',
    icon: 'i-lucide-download',
    click: () => handleDownload(row),
  },
  {
    label: 'Delete',
    icon: 'i-lucide-trash',
    click: () => handleDelete(row),
  },
]

// Methods
const fetchMedia = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    })

    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }

    if (selectedType.value !== 'all') {
      params.append('type', selectedType.value)
    }

    const response = await api.get<{ data: Media[], pagination: any }>(`/media?${params.toString()}`)

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

const handleOpenUpload = () => {
  console.log('handleOpenUpload called, current value:', showUploadModal.value)
  showUploadModal.value = true
  console.log('after set, value:', showUploadModal.value)
}

const handleUploaded = async () => {
  // Refresh the media list after upload
  await fetchMedia()
}

const handleView = (item: Media) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const handleDownload = (item: Media) => {
  if (item.file) {
    window.open(item.file.url, '_blank')
  }
}

const handleDelete = (item: Media | null) => {
  if (!item) return
  selectedItem.value = item
  showDetailModal.value = false
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!selectedItem.value) return

  deleting.value = true
  try {
    await api.delete(`/media/${selectedItem.value.id}`)

    toast.add({
      title: 'Success',
      description: 'Media deleted successfully',
      color: 'success',
    })

    showDeleteModal.value = false
    await fetchMedia()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to delete media',
      color: 'error',
    })
  } finally {
    deleting.value = false
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

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchMedia()
}

const handlePerPageChange = (perPage: number) => {
  pagination.limit = perPage
  pagination.page = 1
  fetchMedia()
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const showContextMenu = (event: MouseEvent, item: Media) => {
  // Context menu handled by BaseTable
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

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  fetchMedia()
})
</script>

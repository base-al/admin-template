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

        <!-- Breadcrumb Navigation -->
        <nav v-if="breadcrumbs.length > 0" class="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
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

            <!-- New Folder Button -->
            <UButton
              icon="i-lucide-folder-plus"
              variant="outline"
              @click="showCreateFolder = true"
            >
              New Folder
            </UButton>

            <!-- View Toggle -->
            <UButton
              :icon="viewMode === 'grid' ? 'i-lucide-list' : 'i-lucide-grid'"
              variant="outline"
              @click="toggleViewMode"
            />
          </div>
        </div>

        <!-- Grid View -->
        <div v-if="viewMode === 'grid'">
          <div v-if="!loading && (folders.length > 0 || files.length > 0)">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <!-- Folders First -->
              <div
                v-for="folder in folders"
                :key="`folder-${folder.id}`"
                class="cursor-pointer border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
                @click="handleView(folder)"
              >
                <div class="aspect-square flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded mb-2">
                  <UIcon name="i-lucide-folder" class="w-12 h-12 text-amber-500" />
                </div>
                <p class="text-sm font-medium truncate text-center">{{ folder.name }}</p>
              </div>

              <!-- Files -->
              <MediaCard
                v-for="file in files"
                :key="`file-${file.id}`"
                :media="file"
                @click="handleView"
              />
            </div>

            <!-- Pagination -->
            <div v-if="pagination.total > pagination.limit" class="flex justify-center mt-6">
              <UPagination
                v-model="pagination.page"
                :total="pagination.total"
                :items-per-page="pagination.limit"
                @update:model-value="handlePageChange"
              />
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!loading" class="flex flex-col items-center justify-center py-12">
            <UIcon name="i-lucide-image" class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No media files</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Upload your first file to get started</p>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </div>

        <!-- List View -->
        <UCard v-else-if="viewMode === 'list'">
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

        <!-- Upload Modal -->
        <MediaUploadModal
          v-model="showUploadModal"
          :parent-id="currentFolderId"
          @uploaded="handleUploaded"
        />

        <!-- Preview Slideover -->
        <MediaSlideover
          v-model="showDetailModal"
          :media="selectedItem"
          :deleting="deleting"
          @delete="handleDelete"
          @download="handleDownload"
          @copy="copyToClipboard"
        />

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
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
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
  parent_id?: number | null
  file?: MediaFile
  original_file?: MediaFile
  created_at: string
  updated_at: string
}

interface Breadcrumb {
  id: number
  name: string
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
const showCreateFolder = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)
const selectedItem = ref<Media | null>(null)
const deleting = ref(false)
const currentFolderId = ref<number | null>(null)
const breadcrumbs = ref<Breadcrumb[]>([])

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
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

// Separate folders and files
const folders = computed(() => mediaItems.value.filter(item => item.type === 'folder' || !item.file))
const files = computed(() => mediaItems.value.filter(item => item.type !== 'folder' && item.file))

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
    const params: Record<string, string | number> = {
      page: pagination.page,
      limit: pagination.limit,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (selectedType.value !== 'all') {
      params.type = selectedType.value
    }

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
  // If it's a folder, navigate into it
  if (item.type === 'folder' || !item.file) {
    navigateToFolder(item.id)
  } else {
    // Otherwise show preview
    selectedItem.value = item
    showDetailModal.value = true
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

const handleDownload = (item: Media | null, fileType: 'converted' | 'original' = 'converted') => {
  const fileUrl = fileType === 'converted' ? item?.file?.url : item?.original_file?.url
  if (fileUrl) {
    window.open(fileUrl, '_blank')
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
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to delete media',
      color: 'error',
    })
  } finally {
    deleting.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      title: 'Copied',
      description: 'URL copied to clipboard',
      color: 'success',
    })
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to copy URL',
      color: 'error',
    })
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


onMounted(() => {
  fetchMedia()
})
</script>

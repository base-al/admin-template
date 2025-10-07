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
        <BaseGrid
          v-if="viewMode === 'grid'"
          :data="mediaItems"
          :loading="loading"
          :pagination="{
            current_page: pagination.page,
            per_page: pagination.limit,
            total: pagination.total
          }"
          empty-icon="i-lucide-image"
          empty-title="No media files"
          empty-message="Upload your first file to get started"
          @page-change="handlePageChange"
          @per-page-change="handlePerPageChange"
        >
          <template #default="{ items }">
            <MediaCard
              v-for="item in items"
              :key="item.id"
              :media="item"
              @click="handleView"
            />
          </template>
        </BaseGrid>

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
  description: string
  file?: MediaFile
  original_file?: MediaFile
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
  console.log('handleView called with item:', item)
  selectedItem.value = item
  console.log('selectedItem set to:', selectedItem.value)
  showDetailModal.value = true
  console.log('showDetailModal set to:', showDetailModal.value)
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

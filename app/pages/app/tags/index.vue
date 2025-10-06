<template>
  <UDashboardPanel>
    <template #body>
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Tags</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Manage your tags
            </p>
          </div>

          <CommonPermissionButton
            permission="tag:create"
            icon="i-lucide-plus"
            @click="handleCreate"
          >
            Create Tag
          </CommonPermissionButton>
        </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <UInput
        v-model="filters.search"
        icon="i-lucide-search"
        placeholder="Search tags..."
        @update:model-value="applyFilters"
      />
    </div>

    <!-- Table -->
    <UCard>
      <TagTable
        :tags="tags"
        :loading="loading"
        :pagination="pagination"
        @edit="handleEdit"
        @delete="handleDelete"
        @view="handleView"
        @page-change="handlePageChange"
      />
    </UCard>

    <!-- Form Modal -->
    <TagFormModal
      v-model="showFormModal"
      :item="selectedItem"
      :loading="submitting"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <template #header>
        Delete Tag
      </template>

      <template #body>
        <div class="space-y-4">
          <p>Are you sure you want to delete this tag?</p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            @click="showDeleteModal = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="deleting"
            @click="confirmDelete"
          >
            Delete
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
import { storeToRefs } from 'pinia'
import { useTagsStore } from '~/modules/tags/stores/tags'
import type { Tag, CreateTagInput, UpdateTagInput } from '~/modules/tags/types/tag'
import TagTable from '~/modules/tags/components/TagTable.vue'
import TagFormModal from '~/modules/tags/components/TagFormModal.vue'

definePageMeta({
  layout: 'default',
})

const tagsStore = useTagsStore()
const { tags, loading, pagination } = storeToRefs(tagsStore)
const toast = useToast()

const showFormModal = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref<Tag | undefined>()
const deleting = ref(false)
const submitting = ref(false)

const filters = reactive({
  search: '',
})

const applyFilters = () => {
  tagsStore.setFilters(filters)
  tagsStore.fetchTags()
}

const handleCreate = () => {
  selectedItem.value = undefined
  showFormModal.value = true
}

const handleEdit = (item: Tag) => {
  selectedItem.value = item
  showFormModal.value = true
}

const handleView = (item: Tag) => {
  navigateTo(`/app/tags/${item.id}`)
}

const handleDelete = (item: Tag) => {
  selectedItem.value = item
  showDeleteModal.value = true
}

const handleSubmit = async (data: CreateTagInput | UpdateTagInput) => {
  submitting.value = true
  try {
    if (selectedItem.value) {
      await tagsStore.updateTag(selectedItem.value.id, data as UpdateTagInput)
      toast.add({
        title: 'Success',
        description: 'Tag updated successfully',
        color: 'success',
      })
    } else {
      await tagsStore.createTag(data as CreateTagInput)
      toast.add({
        title: 'Success',
        description: 'Tag created successfully',
        color: 'success',
      })
    }
    showFormModal.value = false
    await tagsStore.fetchTags()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to save tag',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async () => {
  if (!selectedItem.value) return

  deleting.value = true
  try {
    await tagsStore.deleteTag(selectedItem.value.id)
    toast.add({
      title: 'Success',
      description: 'Tag deleted successfully',
      color: 'success',
    })
    showDeleteModal.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to delete tag',
      color: 'error',
    })
  } finally {
    deleting.value = false
  }
}

const handlePageChange = (page: number) => {
  tagsStore.fetchTags(page)
}

onMounted(() => {
  tagsStore.fetchTags()
})
</script>

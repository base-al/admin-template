<template>
  <UDashboardPanel>
    <template #body>
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Posts</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Manage your blog posts
            </p>
          </div>

          <CommonPermissionButton
            permission="post:create"
            icon="i-lucide-plus"
            @click="handleCreate"
          >
            Create Post
          </CommonPermissionButton>
        </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <UInput
        v-model="filters.search"
        icon="i-lucide-search"
        placeholder="Search posts..."
        @update:model-value="applyFilters"
      />
      <USelect
        v-model="filters.status"
        :items="statusOptions"
        placeholder="Filter by status"
        @update:model-value="applyFilters"
      />
      <USelect
        v-model="filters.category"
        :items="categoryOptions"
        placeholder="Filter by category"
        @update:model-value="applyFilters"
      />
      <USelect
        v-model="filters.published"
        :items="publishedOptions"
        placeholder="Filter by published"
        @update:model-value="applyFilters"
      />
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Posts</p>
            <p class="text-2xl font-bold">{{ postsStore.pagination.total }}</p>
          </div>
          <UIcon name="i-lucide-file-text" class="w-8 h-8 text-blue-500" />
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Published</p>
            <p class="text-2xl font-bold">{{ postsStore.publishedPosts.length }}</p>
          </div>
          <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-green-500" />
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Drafts</p>
            <p class="text-2xl font-bold">{{ postsStore.draftPosts.length }}</p>
          </div>
          <UIcon name="i-lucide-file-edit" class="w-8 h-8 text-gray-500" />
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Featured</p>
            <p class="text-2xl font-bold">{{ postsStore.featuredPosts.length }}</p>
          </div>
          <UIcon name="i-lucide-star" class="w-8 h-8 text-yellow-500" />
        </div>
      </UCard>
    </div>
     <!-- Table -->
    <UCard>
      <PostsTable
        :posts="posts"
        :loading="loading"
        :pagination="pagination"
        @edit="handleEdit"
        @delete="handleDelete"
        @view="handleView"
        @toggle-featured="handleToggleFeatured"
        @toggle-published="handleTogglePublished"
        @page-change="handlePageChange"
      />
    </UCard>

    <!-- Form Modal -->
    <PostFormModal
      v-model="showFormModal"
      :post="selectedPost"
      :loading="submitting"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <template #header>
        Delete Post
      </template>

      <template #body>
        <div class="space-y-4">
          <p>Are you sure you want to delete this post?</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <strong>{{ selectedPost?.title }}</strong>
          </p>
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
import { usePostsStore } from '~/modules/posts/stores/posts'
import type { Post, CreatePostInput, UpdatePostInput } from '~/modules/posts/types/post'
import PostsTable from '~/modules/posts/components/PostsTable.vue'
import PostFormModal from '~/modules/posts/components/PostFormModal.vue'

definePageMeta({
  layout: 'default',
})

const postsStore = usePostsStore()
const { posts, loading, pagination } = storeToRefs(postsStore)
const toast = useToast()

const showFormModal = ref(false)
const showDeleteModal = ref(false)
const selectedPost = ref<Post | undefined>()
const deleting = ref(false)
const submitting = ref(false)

const filters = reactive({
  search: '',
  status: undefined,
  category: undefined,
  published: undefined,
})

const statusOptions = [
  { label: 'All Statuses', value: undefined },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
  { label: 'Scheduled', value: 'scheduled' },
]

const categoryOptions = [
  { label: 'All Categories', value: undefined },
  { label: 'Blog', value: 'blog' },
  { label: 'News', value: 'news' },
  { label: 'Tutorial', value: 'tutorial' },
  { label: 'Announcement', value: 'announcement' },
]

const publishedOptions = [
  { label: 'All', value: undefined },
  { label: 'Published', value: true },
  { label: 'Unpublished', value: false },
]

const applyFilters = () => {
  postsStore.setFilters(filters)
  postsStore.fetchPosts()
}

const handleCreate = () => {
  selectedPost.value = undefined
  showFormModal.value = true
}

const handleEdit = (post: Post) => {
  selectedPost.value = post
  showFormModal.value = true
}

const handleView = (post: Post) => {
  navigateTo(`/app/posts/${post.id}`)
}

const handleDelete = (post: Post) => {
  selectedPost.value = post
  showDeleteModal.value = true
}

const handleToggleFeatured = async (post: Post) => {
  try {
    await postsStore.toggleFeatured(post.id)
    toast.add({
      title: 'Success',
      description: `Post ${post.featured ? 'unfeatured' : 'featured'}`,
      color: 'success',
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to toggle featured status',
      color: 'error',
    })
  }
}

const handleTogglePublished = async (post: Post) => {
  try {
    if (post.published) {
      await postsStore.unpublishPost(post.id)
      toast.add({
        title: 'Success',
        description: 'Post unpublished',
        color: 'success',
      })
    } else {
      await postsStore.publishPost(post.id)
      toast.add({
        title: 'Success',
        description: 'Post published',
        color: 'success',
      })
    }
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to toggle published status',
      color: 'error',
    })
  }
}

const handleSubmit = async (data: CreatePostInput | UpdatePostInput) => {
  submitting.value = true
  try {
    if (selectedPost.value) {
      await postsStore.updatePost(selectedPost.value.id, data as UpdatePostInput)
      toast.add({
        title: 'Success',
        description: 'Post updated successfully',
        color: 'success',
      })
    } else {
      await postsStore.createPost(data as CreatePostInput)
      toast.add({
        title: 'Success',
        description: 'Post created successfully',
        color: 'success',
      })
    }
    showFormModal.value = false
    await postsStore.fetchPosts()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to save post',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async () => {
  if (!selectedPost.value) return

  deleting.value = true
  try {
    await postsStore.deletePost(selectedPost.value.id)
    toast.add({
      title: 'Success',
      description: 'Post deleted successfully',
      color: 'success',
    })
    showDeleteModal.value = false
    await postsStore.fetchPosts()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to delete post',
      color: 'error',
    })
  } finally {
    deleting.value = false
  }
}

const handlePageChange = (page: number) => {
  postsStore.fetchPosts(page)
}

onMounted(() => {
  postsStore.fetchPosts()
})
</script>

<template>
  <UDashboardPanel v-if="post">
    <template #body>
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div class="flex items-center gap-4">
            <UButton
              icon="i-lucide-arrow-left"
              variant="ghost"
              size="sm"
              @click="goBack"
            />
            <div class="space-y-1">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ post.title }}</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatDateTime(post.created_at) }}</p>
            </div>
          </div>
      <div class="flex gap-2">
        <CommonPermissionButton
          permission="post:update"
          icon="i-lucide-pencil"
          variant="outline"
          @click="handleEdit"
        >
          Edit
        </CommonPermissionButton>
        <CommonPermissionButton
          permission="post:delete"
          icon="i-lucide-trash"
          color="error"
          variant="outline"
          @click="handleDelete"
        >
          Delete
        </CommonPermissionButton>
      </div>
    </div>

    <!-- Status Bar -->
    <UCard>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UBadge :color="getStatusColor(post.status)" size="lg">
            {{ formatPostStatus(post.status) }}
          </UBadge>
          <UBadge :color="getCategoryColor(post.category)" variant="soft" size="lg">
            {{ formatPostCategory(post.category) }}
          </UBadge>
          <UBadge v-if="post.featured" color="yellow" variant="soft">
            <UIcon name="i-lucide-star" class="w-4 h-4 mr-1" />
            Featured
          </UBadge>
          <UBadge v-if="post.is_pinned" color="blue" variant="soft">
            <UIcon name="i-lucide-pin" class="w-4 h-4 mr-1" />
            Pinned
          </UBadge>
        </div>
        <div class="flex gap-2">
          <CommonPermissionButton
            v-if="!post.published"
            permission="post:update"
            icon="i-lucide-send"
            @click="handlePublish"
          >
            Publish
          </CommonPermissionButton>
          <CommonPermissionButton
            v-if="post.published"
            permission="post:update"
            icon="i-lucide-eye-off"
            variant="outline"
            @click="handleUnpublish"
          >
            Unpublish
          </CommonPermissionButton>
        </div>
      </div>
    </UCard>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column - Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Featured Image -->
        <UCard v-if="post.featured_image">
          <img
            :src="post.featured_image"
            :alt="post.title"
            class="w-full h-auto rounded-lg"
          />
        </UCard>

        <!-- Excerpt -->
        <UCard v-if="post.excerpt">
          <div>
            <h3 class="text-lg font-semibold mb-2">Excerpt</h3>
            <p class="text-gray-600">{{ post.excerpt }}</p>
          </div>
        </UCard>

        <!-- Content -->
        <UCard>
          <div>
            <h3 class="text-lg font-semibold mb-4">Content</h3>
            <div class="prose max-w-none" v-html="post.content"></div>
          </div>
        </UCard>
      </div>

      <!-- Right Column - Metadata -->
      <div class="space-y-6">
        <!-- Stats -->
        <UCard>
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Stats</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">Views</span>
                <span class="font-semibold">{{ formatNumber(post.view_count) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Likes</span>
                <span class="font-semibold">{{ formatNumber(post.like_count) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Comments</span>
                <span class="font-semibold">{{ formatNumber(post.comment_count) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Rating</span>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-star" class="text-yellow-500 w-4 h-4" />
                  <span class="font-semibold">{{ formatRating(post.rating) }}</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Details -->
        <UCard>
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Details</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-600">Slug</p>
                <p class="font-mono text-sm">{{ post.slug }}</p>
              </div>
              <div v-if="post.author">
                <p class="text-sm text-gray-600">Author</p>
                <p class="font-medium">{{ post.author.first_name }} {{ post.author.last_name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Created</p>
                <p>{{ formatDateTime(post.created_at) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Updated</p>
                <p>{{ formatDateTime(post.updated_at) }}</p>
              </div>
              <div v-if="post.published_at">
                <p class="text-sm text-gray-600">Published</p>
                <p>{{ formatDateTime(post.published_at) }}</p>
              </div>
              <div v-if="post.scheduled_at">
                <p class="text-sm text-gray-600">Scheduled</p>
                <p>{{ formatDateTime(post.scheduled_at) }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Tags -->
        <UCard v-if="post.tags && post.tags.length > 0">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Tags</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="tag in post.tags"
                :key="tag"
                color="neutral"
                variant="soft"
              >
                {{ tag }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <!-- Metadata -->
        <UCard v-if="post.metadata && Object.keys(post.metadata).length > 0">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Metadata</h3>
            <pre class="text-xs bg-gray-50 p-3 rounded overflow-auto">{{ JSON.stringify(post.metadata, null, 2) }}</pre>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Delete Modal -->
    <UModal v-model="showDeleteModal">
      <template #header>
        Delete Post
      </template>

      <template #body>
        <div>
          <p>Are you sure you want to delete this post?</p>
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

  <UDashboardPanel v-else-if="loading">
    <template #body>
      <div class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
      </div>
    </template>
  </UDashboardPanel>

  <UDashboardPanel v-else>
    <template #body>
      <div class="flex flex-col items-center justify-center py-12 gap-3">
        <UIcon name="i-lucide-file-x" class="w-12 h-12 text-gray-400 dark:text-gray-500" />
        <p class="text-lg text-gray-500 dark:text-gray-400">Post not found</p>
        <UButton @click="goBack">Go Back</UButton>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePostsStore } from '~/modules/posts/stores/posts'
import type { Post } from '~/modules/posts/types/post'
import {
  formatDateTime,
  formatPostStatus,
  formatPostCategory,
  getStatusColor,
  getCategoryColor,
  formatNumber,
  formatRating,
} from '~/modules/posts/utils/formatters'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const toast = useToast()

const post = ref<Post | null>(null)
const loading = ref(true)
const showDeleteModal = ref(false)
const deleting = ref(false)

const postId = computed(() => Number(route.params.id))

const loadPost = async () => {
  loading.value = true
  try {
    post.value = await postsStore.fetchPost(postId.value)
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to load post',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/app/posts')
}

const handleEdit = () => {
  // Navigate to edit page or open edit modal
  router.push(`/app/posts/${postId.value}/edit`)
}

const handleDelete = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await postsStore.deletePost(postId.value)
    toast.add({
      title: 'Success',
      description: 'Post deleted successfully',
      color: 'success',
    })
    router.push('/app/posts')
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

const handlePublish = async () => {
  try {
    await postsStore.publishPost(postId.value)
    toast.add({
      title: 'Success',
      description: 'Post published successfully',
      color: 'success',
    })
    await loadPost()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to publish post',
      color: 'error',
    })
  }
}

const handleUnpublish = async () => {
  try {
    await postsStore.unpublishPost(postId.value)
    toast.add({
      title: 'Success',
      description: 'Post unpublished successfully',
      color: 'success',
    })
    await loadPost()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to unpublish post',
      color: 'error',
    })
  }
}

onMounted(() => {
  loadPost()
})
</script>

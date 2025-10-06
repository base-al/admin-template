<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'max-w-4xl',footer: 'flex justify-end gap-2' }">
    <template #header>
      {{ isEdit ? 'Edit Post' : 'Create Post' }}
    </template>
    <template #body>
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Basic Information</h3>

        <div class="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <UFormField label="Title" required>
            <UInput
              v-model="form.title"
              placeholder="Enter post title"
              @blur="generateSlugFromTitle"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Slug" required  >
            <UInput
              v-model="form.slug"
              placeholder="post-slug"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Category" required>
            <USelect
              v-model="form.category"
              :items="categoryOptions"
              placeholder="Select category"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Status">
            <USelect
              v-model="form.status"
              :items="statusOptions"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-4">
 
        <div class="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <UFormField label="Content" required class="sm:col-span-2">
            <UTextarea
              v-model="form.content"
              placeholder="Enter post content"
              :rows="6"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Excerpt" class="sm:col-span-2">
            <UTextarea
              v-model="form.excerpt"
              placeholder="Short description (optional)"
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <!-- Media & Tags -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Media & Tags</h3>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <UFormField label="Featured Image">
            <div class="space-y-2">
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleFileChange"
                class="hidden w-full"
              />
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                icon="i-lucide-upload"
                @click="fileInput?.click()"
                class="w-full"
              >
                Choose Image
              </UButton>
              <p v-if="selectedFileName" class="text-sm text-gray-600 dark:text-gray-400">
                {{ selectedFileName }}
              </p>
              <img
                v-if="previewUrl"
                :src="previewUrl"
                alt="Preview"
                class="mt-2 max-w-full h-40 object-cover rounded-lg"
              />
            </div>
          </UFormField>

          <UFormField label="Tags">
            <div class="space-y-2">
              <div class="flex gap-2">
                <UInput
                  v-model="tagInput"
                  placeholder="Add tag"
                  class="flex-1 w-full"
                  @keydown.enter.prevent="addTag"
                />
                <UButton
                  type="button"
                  color="neutral"
                  icon="i-lucide-plus"
                  @click="addTag"
                >
                  Add
                </UButton>
              </div>
              <div v-if="form.tags && form.tags.length > 0" class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(tag, index) in form.tags"
                  :key="index"
                  color="neutral"
                  variant="soft"
                >
                  {{ tag }}
                  <button
                    type="button"
                    @click="removeTag(index)"
                    class="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </UBadge>
              </div>
            </div>
          </UFormField>
        </div>
      </div>

      <!-- Publishing Options -->
      <div class="space-y-4 w-full flex  justify-between">

        <div class="w-full">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Publishing Options</h3>
        <div class="flex flex-wrap gap-6 w-full">
          <UCheckbox
            v-model="form.published"
            label="Published"
          />
          <UCheckbox
            v-model="form.featured"
            label="Featured"
          />
          <UCheckbox
            v-model="form.is_pinned"
            label="Pinned"
          />
        </div></div>
        <div class="flex flex-wrap gap-6 w-full   ">
          <UFormField label="Publish Date">
            <UInput
              v-model="form.published_at"
              type="datetime-local"
            />
          </UFormField>
          <UFormField label="Schedule Date">
            <UInput
              v-model="form.scheduled_at"
              type="datetime-local"
            />
          </UFormField>
        </div>
      </div>

    </form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          @click="closeModal"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          :loading="props.loading"
          @click="handleSubmit"
        >
          {{ isEdit ? 'Update' : 'Create' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CreatePostInput, UpdatePostInput, Post, PostListResponse } from '../types/post'
import { generateSlug } from '../utils/formatters'

const props = defineProps<{
  modelValue: boolean
  post?: Post
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: CreatePostInput | UpdatePostInput]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEdit = computed(() => !!props.post)
const fileInput = ref<HTMLInputElement>()
const selectedFileName = ref('')
const previewUrl = ref('')
const tagInput = ref('')

const form = ref<CreatePostInput>({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  category: 'blog',
  status: 'draft',
  published: false,
  featured: false,
  is_pinned: false,
  tags: [],
  metadata: {},
  published_at: undefined,
  scheduled_at: undefined,
})

const categoryOptions = [
  { label: 'Blog', value: 'blog' },
  { label: 'News', value: 'news' },
  { label: 'Tutorial', value: 'tutorial' },
  { label: 'Announcement', value: 'announcement' },
]

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
  { label: 'Scheduled', value: 'scheduled' },
]

const generateSlugFromTitle = () => {
  if (form.value.title && !form.value.slug) {
    form.value.slug = generateSlug(form.value.title)
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    form.value.featured_image = file
    selectedFileName.value = file.name
    previewUrl.value = URL.createObjectURL(file)
  }
}

const addTag = () => {
  if (tagInput.value.trim()) {
    if (!form.value.tags) form.value.tags = []
    form.value.tags.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  form.value.tags?.splice(index, 1)
}

const handleSubmit = () => {
  emit('submit', form.value)
}

const closeModal = () => {
  isOpen.value = false
  resetForm()
}

const resetForm = () => {
  form.value = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: 'blog',
    status: 'draft',
    published: false,
    featured: false,
    is_pinned: false,
    tags: [],
    metadata: {},
    published_at: null,
    scheduled_at: null,
  }
  selectedFileName.value = ''
  previewUrl.value = ''
}

// Watch for post prop changes
watch(() => props.post, (post) => {
  if (post) {
    form.value = {
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      category: post.category,
      status: post.status,
      published: post.published,
      featured: post.featured,
      is_pinned: post.is_pinned,
      tags: post.tags || [],
      metadata: post.metadata || {},
      published_at: post.published_at,
      scheduled_at: post.scheduled_at,
    }
    if (post.featured_image) {
      previewUrl.value = post.featured_image
    }
  } else {
    resetForm()
  }
}, { immediate: true })
</script>

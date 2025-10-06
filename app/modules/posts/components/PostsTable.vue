<template>
  <div class="space-y-4">
    <!-- Table -->
    <UTable
      :data="posts"
      :columns="columns"
      :loading="loading"
      @select="onRowClick"
    />

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex justify-center">
      <UPagination
        v-model="currentPage"
        :total="pagination.total"
        :page-count="pagination.limit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, resolveComponent } from 'vue'
import type { Post } from '../types/post'
import type { TableColumn, TableRow } from '@nuxt/ui'
import {
  formatPostStatus,
  formatPostCategory,
  getStatusColor,
  getCategoryColor,
  formatNumber,
  formatRating,
  formatRelativeTime,
} from '../utils/formatters'

const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const props = defineProps<{
  posts: Post[]
  loading: boolean
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}>()

const emit = defineEmits<{
  edit: [post: Post]
  delete: [post: Post]
  view: [post: Post]
  toggleFeatured: [post: Post]
  togglePublished: [post: Post]
  pageChange: [page: number]
}>()

const currentPage = computed({
  get: () => props.pagination.page,
  set: (value) => emit('pageChange', value),
})

const columns: TableColumn<Post>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Post['status']
      return h(UBadge, { color: getStatusColor(status) }, () => formatPostStatus(status))
    }
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.getValue('category') as Post['category']
      return h(UBadge, { color: getCategoryColor(category), variant: 'soft' }, () => formatPostCategory(category))
    }
  },
  {
    accessorKey: 'featured',
    header: 'Featured',
    cell: ({ row }) => {
      const featured = row.getValue('featured') as Post['featured']
      return h(UIcon, {
        name: featured ? 'i-lucide-star' : 'i-lucide-star-off',
        class: featured ? 'text-yellow-500' : 'text-gray-400'
      })
    }
  },
  {
    accessorKey: 'published',
    header: 'Published',
    cell: ({ row }) => {
      const published = row.getValue('published') as boolean
      return h(UBadge, {
        color: published ? 'success' : 'neutral',
        variant: 'soft'
      }, () => published ? 'Yes' : 'No')
    }
  },
  {
    accessorKey: 'view_count',
    header: 'Views',
    cell: ({ row }) => {
      return h('span', { class: 'text-gray-600 dark:text-gray-400' }, formatNumber(row.getValue('view_count') as number))
    }
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-1' }, [
        h(UIcon, { name: 'i-lucide-star', class: 'text-yellow-500 w-4 h-4' }),
        h('span', {}, formatRating(row.getValue('rating') as number))
      ])
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-gray-600 dark:text-gray-400' }, formatRelativeTime(row.getValue('created_at') as string))
    }
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(UDropdownMenu, { items: getActionItems(row.original) }, () =>
        h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          icon: 'i-lucide-more-horizontal'
        })
      )
    }
  },
]

const getActionItems = (post: Post) => [
  [
    {
      label: 'View',
      icon: 'i-lucide-eye',
      click: () => emit('view', post),
    },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      click: () => emit('edit', post),
    },
  ],
  [
    {
      label: post.featured ? 'Unfeature' : 'Feature',
      icon: post.featured ? 'i-lucide-star-off' : 'i-lucide-star',
      click: () => emit('toggleFeatured', post),
    },
    {
      label: post.published ? 'Unpublish' : 'Publish',
      icon: post.published ? 'i-lucide-eye-off' : 'i-lucide-send',
      click: () => emit('togglePublished', post),
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      click: () => emit('delete', post),
      color: 'error',
    },
  ],
]

const onRowClick = (row: TableRow<Post>) => {
  emit('view', row.original)
}
</script>
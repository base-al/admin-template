<template>
  <div class="space-y-4">
    <!-- Table -->
    <UTable
      :data="tags"
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
import type { Tag } from '../types/tag'
import type { TableColumn } from '@nuxt/ui'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const props = defineProps<{
  tags: Tag[]
  loading: boolean
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}>()

const emit = defineEmits<{
  edit: [item: Tag]
  delete: [item: Tag]
  view: [item: Tag]
  pageChange: [page: number]
}>()

const currentPage = computed({
  get: () => props.pagination.page,
  set: (value) => emit('pageChange', value),
})

const columns: TableColumn<Tag>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at') as string)
      return h('span', { class: 'text-sm text-gray-600 dark:text-gray-400' },
        date.toLocaleDateString()
      )
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

const getActionItems = (item: Tag) => [
  [
    {
      label: 'View',
      icon: 'i-lucide-eye',
      click: () => emit('view', item),
    },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      click: () => emit('edit', item),
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      click: () => emit('delete', item),
      color: 'error',
    },
  ],
]

const onRowClick = (row: Tag) => {
  emit('view', row)
}
</script>

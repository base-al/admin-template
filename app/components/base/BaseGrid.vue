<template>
  <div class="space-y-4">
    <!-- Grid -->
    <div :class="gridClass">
      <slot :items="data" />
    </div>

    <!-- Empty State -->
    <div v-if="!loading && data.length === 0" class="text-center py-12">
      <slot name="empty">
        <UIcon :name="emptyIcon" class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {{ emptyTitle }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          {{ emptyMessage }}
        </p>
      </slot>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <!-- Pagination -->
    <div v-if="!loading && data.length > 0 && pagination" class="flex items-center justify-between pt-4 border-t dark:border-gray-700">
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Showing {{ startIndex }} to {{ endIndex }} of {{ pagination.total }} results
        </span>
        <USelect
          :model-value="pagination.per_page"
          :items="perPageOptions"
          class="w-32"
          @update:model-value="$emit('perPageChange', $event)"
        />
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          variant="outline"
          size="sm"
          :disabled="pagination.current_page <= 1"
          @click="$emit('pageChange', pagination.current_page - 1)"
        />
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Page {{ pagination.current_page }} of {{ totalPages }}
        </span>
        <UButton
          icon="i-lucide-chevron-right"
          variant="outline"
          size="sm"
          :disabled="pagination.current_page >= totalPages"
          @click="$emit('pageChange', pagination.current_page + 1)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { computed } from 'vue'

interface Pagination {
  current_page: number
  per_page: number
  total: number
}

const props = withDefaults(defineProps<{
  data: T[]
  loading?: boolean
  pagination?: Pagination
  gridClass?: string
  emptyIcon?: string
  emptyTitle?: string
  emptyMessage?: string
}>(), {
  loading: false,
  pagination: undefined,
  gridClass: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4',
  emptyIcon: 'i-lucide-inbox',
  emptyTitle: 'No items found',
  emptyMessage: 'There are no items to display',
})

defineEmits<{
  pageChange: [page: number]
  perPageChange: [perPage: number]
}>()

const perPageOptions = [
  { label: '10 per page', value: 10 },
  { label: '20 per page', value: 20 },
  { label: '50 per page', value: 50 },
  { label: '100 per page', value: 100 },
]

const totalPages = computed(() => {
  if (!props.pagination)
    return 0
  return Math.ceil(props.pagination.total / props.pagination.per_page)
})

const startIndex = computed(() => {
  if (!props.pagination || props.data.length === 0)
    return 0
  return (props.pagination.current_page - 1) * props.pagination.per_page + 1
})

const endIndex = computed(() => {
  if (!props.pagination)
    return 0
  const end = props.pagination.current_page * props.pagination.per_page
  return Math.min(end, props.pagination.total)
})
</script>

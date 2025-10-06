<script setup lang="ts" generic="T">
import { h, resolveComponent } from 'vue'
import type { ContextMenuItem, TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'

// Filter option type
interface FilterOption {
  label: string
  value: string
}

// Additional filter configuration
interface AdditionalFilter {
  key: string
  value: string
  options: FilterOption[]
  placeholder?: string
  class?: string
}

// Pagination configuration
interface PaginationConfig {
  current_page: number
  per_page: number
  total: number
}

// Status filter configuration  
interface StatusFilterConfig {
  value: string
  options: FilterOption[]
}

// Generic type for table data
interface BaseTableProps<T = Record<string, unknown>> {
  // Data and columns
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  
  // Table configuration
  tableName: string // Used for localStorage key
  searchColumn?: string // Column to search in
  searchPlaceholder?: string
  
  // Pagination
  pagination?: PaginationConfig
  
  // Filtering
  statusFilter?: StatusFilterConfig
  
  // Additional filters
  additionalFilters?: AdditionalFilter[]
  
  // Context menu
  contextMenuItems?: (row: T) => ContextMenuItem[]
  
  // Navigation
  onRowClick?: (row: T) => void
  
  // Features
  enableBulkActions?: boolean
  enableSearch?: boolean
  enableColumnSettings?: boolean
}

// Props with defaults
const props = withDefaults(defineProps<BaseTableProps<T>>(), {
  loading: false,
  searchPlaceholder: 'Search...',
  searchColumn: 'name',
  enableBulkActions: true,
  enableSearch: true,
  enableColumnSettings: true,
  pagination: undefined,
  statusFilter: undefined,
  additionalFilters: () => [],
  contextMenuItems: undefined,
  onRowClick: undefined
})


// Emits
const emit = defineEmits<{
  'page-change': [page: number]
  'per-page-change': [perPage: number]
  'status-filter-change': [status: string]
  'search-change': [query: string]
  'additional-filter-change': [filterKey: string, value: string]
}>()

// Template refs and reactive state
const table = useTemplateRef('table')
const columnVisibility = ref()
const rowSelection = ref({})
const contextMenuData = ref<ContextMenuItem[]>([])

// Initialize column visibility from localStorage
const storageKey = `${props.tableName}TableColumnVisibility`

if (import.meta.client) {
  const savedVisibility = localStorage.getItem(storageKey)
  if (savedVisibility) {
    try {
      columnVisibility.value = JSON.parse(savedVisibility)
    } catch (error) {
      console.warn('Failed to parse column visibility from localStorage:', error)
    }
  }
}

// Helper components
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')

// Column visibility management
const updateColumnVisibility = (columnId: string, checked: boolean) => {
  if (import.meta.client) {
    localStorage.setItem(storageKey, JSON.stringify(columnVisibility.value))
  }
  table.value?.tableApi?.getColumn(columnId)?.toggleVisibility(!!checked)
}

// Enhanced columns with optional selection checkbox
const enhancedColumns = computed(() => {
  const columns = [...props.columns]
  
  // Add select column only if bulk actions are enabled
  if (props.enableBulkActions) {
    const selectColumn = {
      id: 'select',
      header: ({ table }: { table: any }) =>
        h(UCheckbox, {
          'modelValue': table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : (table as any).getIsAllPageRowsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            (table as any).toggleAllPageRowsSelected(!!value),
          'ariaLabel': 'Select all'
        }),
      cell: ({ row }: { row: any }) =>
        h(UCheckbox, {
          'modelValue': (row as any).getIsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') => (row as any).toggleSelected(!!value),
          'ariaLabel': 'Select row'
        })
    }
    columns.unshift(selectColumn)
  }
  
  return columns
})

// Context menu handling
const onContextmenu = (_e: Event, row: any) => {
  if (props.contextMenuItems) {
    contextMenuData.value = props.contextMenuItems(row.original as T)
  }
}

// Row click handling
const onRowClick = (row: any) => {
  if (props.onRowClick) {
    props.onRowClick(row.original as T)
  }
}

// Filter handlers
const handleStatusFilterChange = (value: string) => {
  if (!table?.value?.tableApi) return

  const statusColumn = table.value.tableApi.getColumn('status')
  if (!statusColumn) return

  if (value === 'all') {
    statusColumn.setFilterValue(undefined)
  } else {
    statusColumn.setFilterValue(value)
  }
  
  emit('status-filter-change', value)
}

const handleSearchChange = (query: string) => {
  if (!table?.value?.tableApi || !props.searchColumn) return
  
  const searchColumn = table.value.tableApi.getColumn(props.searchColumn)
  if (searchColumn) {
    searchColumn.setFilterValue(query)
  }
  
  emit('search-change', query)
}

const handleAdditionalFilterChange = (filterKey: string, value: string) => {
  if (!table?.value?.tableApi) return

  const filterColumn = table.value.tableApi.getColumn(filterKey)
  if (!filterColumn) return

  if (value === 'all') {
    filterColumn.setFilterValue(undefined)
  } else {
    filterColumn.setFilterValue(value)
  }
  
  emit('additional-filter-change', filterKey, value)
}

// Pagination handlers
const handlePageChange = (page: number) => {
  emit('page-change', page)
}

const handlePerPageChange = (perPage: number) => {
  emit('per-page-change', perPage)
}

// Helper functions for pagination display using actual displayed data
const calculateStartIndex = (pagination: PaginationConfig | undefined) => {
  if (!pagination || !pagination.current_page || !pagination.per_page || pagination.total === 0 || props.data.length === 0) {
    return 0
  }
  
  return ((pagination.current_page - 1) * pagination.per_page) + 1
}

const calculateEndIndex = (pagination: PaginationConfig | undefined) => {
  if (!pagination || !pagination.current_page || !pagination.per_page || pagination.total === 0 || props.data.length === 0) {
    return 0
  }
  
  // Use the actual displayed data length to calculate the end index
  const startIndex = ((pagination.current_page - 1) * pagination.per_page) + 1
  return startIndex + props.data.length - 1
}

// Computed for safer pagination access
const safePagination = computed(() => {
  return props.pagination || {
    current_page: 1,
    per_page: 10,
    total: 0
  }
})

// Table UI configuration
const tableUI = {
  base: 'table-fixed border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0 [&>tr]:hover:bg-elevated/50 [&>tr]:cursor-pointer',
  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
  td: 'border-b border-default'
}
</script>

<template>
  <!-- Filter Controls -->
  <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
    <!-- Search Input -->
    <UInput
      v-if="enableSearch"
      :model-value="(table?.tableApi?.getColumn(searchColumn)?.getFilterValue() as string)"
      class="max-w-sm"
      icon="i-lucide-search"
      :placeholder="searchPlaceholder"
      @update:model-value="handleSearchChange"
    />
    <div v-else/>

    <div class="flex flex-wrap items-center gap-1.5">
      <!-- Status Filter -->
      <USelect
        v-if="statusFilter"
        :model-value="statusFilter.value"
        :items="statusFilter.options"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        placeholder="Filter status"
        class="min-w-28"
        @update:model-value="handleStatusFilterChange"
      />

      <!-- Additional Filters -->
      <USelect
        v-for="filter in additionalFilters"
        :key="filter.key"
        :model-value="filter.value"
        :items="filter.options"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        :placeholder="filter.placeholder"
        :class="filter.class || 'min-w-28'"
        @update:model-value="(value: string) => handleAdditionalFilterChange(filter.key, value)"
      />

      <!-- Per Page Selection -->
      <USelect
        v-if="pagination"
        :model-value="safePagination.per_page"
        :items="[
          { label: '5 per page', value: 5 },
          { label: '10 per page', value: 10 },
          { label: '20 per page', value: 20 },
          { label: '50 per page', value: 50 }
        ]"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        :disabled="loading"
        class="min-w-32"
        @update:model-value="(value: number) => handlePerPageChange(value)"
      />

      <!-- Column Settings -->
      <UDropdownMenu
        v-if="enableColumnSettings"
        :items="
          table?.tableApi
            ?.getAllColumns()
            .filter((column: any) => column.getCanHide())
            .map((column: any) => ({
              label: upperFirst(column.id),
              type: 'checkbox' as const,
              checked: column.getIsVisible(),
              onUpdateChecked(checked: boolean) {
                updateColumnVisibility(column.id, checked)
              },
              onSelect(e?: Event) {
                e?.preventDefault()
              }
            }))
        "
        :content="{ align: 'end' }"
      >
        <UButton
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-settings-2"
        />
      </UDropdownMenu>
    </div>
  </div>

  <!-- Bulk Actions (if rows selected) -->
  <div v-if="enableBulkActions && Object.keys(rowSelection).length > 0" class="bg-elevated/50 border border-default rounded-lg p-4 mb-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium">
          {{ Object.keys(rowSelection).length }} item(s) selected
        </span>
        <UButton size="sm" variant="ghost" @click="rowSelection = {}">
          Clear selection
        </UButton>
      </div>
      <div class="flex items-center gap-2">
        <slot name="bulk-actions" :selected-rows="rowSelection" />
      </div>
    </div>
  </div>

  <!-- Table -->
  <UContextMenu :items="contextMenuData">
    <UTable
      ref="table"
      v-model:column-visibility="columnVisibility"
      v-model:row-selection="rowSelection"
      class="shrink-0"
      :data="data"
      :columns="enhancedColumns"
      :loading="loading"
      :ui="tableUI"
      @select="onRowClick"
      @contextmenu="onContextmenu"
    />
  </UContextMenu>

  <!-- Pagination -->
  <div v-if="pagination && pagination.total > 0" class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto relative">
    <!-- Loading overlay for pagination -->
    <div v-if="loading" class="absolute inset-0 bg-white/50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center z-10">
      <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin text-primary" />
    </div>
    
    <div class="flex items-center gap-4 text-sm text-muted" :class="{ 'opacity-50': loading }">
      <div>
        {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
        {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
      </div>
      <div class="border-l border-default pl-4">
        <span v-if="data.length > 0">
          Showing {{ calculateStartIndex(pagination) }} to
          {{ calculateEndIndex(pagination) }}
          of {{ pagination.total }} {{ tableName.toLowerCase() }}
        </span>
        <span v-else>
          No {{ tableName.toLowerCase() }} found
        </span>
      </div>
    </div>

    <div class="flex items-center gap-1.5" :class="{ 'opacity-50': loading }">
      <UPagination
        :page="pagination.current_page"
        show-edges
        :sibling-count="1"
        :total="pagination.total"
        :items-per-page="pagination.per_page"
        :disabled="loading"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>
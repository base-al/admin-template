import { defineStore } from 'pinia'
import type { Tag, CreateTagInput, UpdateTagInput, TagFilterInput, TagSortInput } from '../types/tag'

interface TagState {
  tags: Tag[]
  currentTag: Tag | null
  loading: boolean
  error: string | null
  filters: TagFilterInput
  sort: TagSortInput
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const useTagsStore = defineStore('tags', {
  state: (): TagState => ({
    tags: [],
    currentTag: null,
    loading: false,
    error: null,
    filters: {},
    sort: {
      field: 'created_at',
      order: 'desc'
    },
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  }),

  getters: {
    getTagById: (state) => (id: number) => {
      return state.tags.find(item => item.id === id)
    },
  },

  actions: {
    async fetchTags(page = 1, limit = 10) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        const params: Record<string, string> = {
          page: page.toString(),
          limit: limit.toString(),
          sort_by: this.sort.field,
          sort_order: this.sort.order,
        }

        // Add filters if they exist
        Object.entries(this.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[key] = String(value)
          }
        })

        const queryString = new URLSearchParams(params).toString()

        const response = await api.get<{
          data: Tag[]
          pagination: {
            total: number
            page: number
            page_size: number
            total_pages: number
          }
        }>(`/tags?${queryString}`)

        this.tags = Array.isArray(response.data) ? response.data : []
        this.pagination = {
          total: response.pagination?.total || 0,
          page: response.pagination?.page || 1,
          limit: response.pagination?.page_size || 10,
          totalPages: response.pagination?.total_pages || 0,
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch tags'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTag(id: number) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        const response = await api.get<{ data: Tag }>(`/tags/${id}`)
        this.currentTag = response.data
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch tag'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createTag(data: CreateTagInput) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        const cleanData: any = { ...data }

        const response = await api.post<{ data: Tag }>('/tags', cleanData)

        this.tags.unshift(response.data)
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to create tag'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateTag(id: number, data: UpdateTagInput) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        const cleanData: any = { ...data }

        const response = await api.put<{ data: Tag }>(`/tags/${id}`, cleanData)

        const index = this.tags.findIndex(p => p.id === id)
        if (index !== -1) {
          this.tags[index] = response.data
        }

        if (this.currentTag?.id === id) {
          this.currentTag = response.data
        }

        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to update tag'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteTag(id: number) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        await api.delete(`/tags/${id}`)

        this.tags = this.tags.filter(p => p.id !== id)

        if (this.currentTag?.id === id) {
          this.currentTag = null
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to delete tag'
        throw error
      } finally {
        this.loading = false
      }
    },

    setFilters(filters: TagFilterInput) {
      this.filters = filters
    },

    setSort(sort: TagSortInput) {
      this.sort = sort
    },

    clearFilters() {
      this.filters = {}
    },

    reset() {
      this.$reset()
    },
  },
})

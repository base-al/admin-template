import { defineStore } from 'pinia'
import type { Post, CreatePostInput, UpdatePostInput, PostFilterInput, PostSortInput } from '../types/post'

interface PostsState {
  posts: Post[]
  currentPost: Post | null
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  filters: PostFilterInput
  sort: PostSortInput
}

export const usePostsStore = defineStore('posts', {
  state: (): PostsState => ({
    posts: [],
    currentPost: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
    filters: {},
    sort: {
      field: 'created_at',
      order: 'desc',
    },
  }),

  getters: {
    publishedPosts: (state) => state.posts.filter(p => p.published),
    draftPosts: (state) => state.posts.filter(p => p.status === 'draft'),
    featuredPosts: (state) => state.posts.filter(p => p.featured),
    postById: (state) => (id: number) => state.posts.find(p => p.id === id),
  },

  actions: {
    async fetchPosts(page = 1, limit = 10) {
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
          data: Post[]
          pagination: {
            total: number
            page: number
            page_size: number
            total_pages: number
          }
        }>(`/posts?${queryString}`)

        // The API returns the data directly, already unwrapped by useApi
        this.posts = Array.isArray(response.data) ? response.data : []
        this.pagination = {
          total: response.pagination?.total || 0,
          page: response.pagination?.page || 1,
          limit: response.pagination?.page_size || 10,
          totalPages: response.pagination?.total_pages || 0,
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch posts'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPost(id: number) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        const response = await api.get<{ data: Post }>(`/posts/${id}`)
        this.currentPost = response.data
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch post'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createPost(data: CreatePostInput) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()

        // Clean up the data
        const cleanData: any = { ...data }

        // Remove file field if present (we'll handle file uploads separately)
        if (cleanData.featured_image instanceof File) {
          delete cleanData.featured_image
        }

        // Remove empty datetime fields
        if (!cleanData.published_at) delete cleanData.published_at
        if (!cleanData.scheduled_at) delete cleanData.scheduled_at

        const response = await api.post<{ data: Post }>('/posts', cleanData)

        this.posts.unshift(response.data)
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to create post'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updatePost(id: number, data: UpdatePostInput) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()

        // Clean up the data
        const cleanData: any = { ...data }

        // Remove file field if present (we'll handle file uploads separately)
        if (cleanData.featured_image instanceof File) {
          delete cleanData.featured_image
        }

        // Remove empty datetime fields
        if (!cleanData.published_at) delete cleanData.published_at
        if (!cleanData.scheduled_at) delete cleanData.scheduled_at

        const response = await api.put<{ data: Post }>(`/posts/${id}`, cleanData)

        const index = this.posts.findIndex(p => p.id === id)
        if (index !== -1) {
          this.posts[index] = response.data
        }

        if (this.currentPost?.id === id) {
          this.currentPost = response.data
        }

        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to update post'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deletePost(id: number) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        await api.delete(`/posts/${id}`)

        this.posts = this.posts.filter(p => p.id !== id)

        if (this.currentPost?.id === id) {
          this.currentPost = null
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to delete post'
        throw error
      } finally {
        this.loading = false
      }
    },

    async publishPost(id: number) {
      return this.updatePost(id, {
        published: true,
        status: 'published',
        published_at: new Date().toISOString(),
      })
    },

    async unpublishPost(id: number) {
      return this.updatePost(id, {
        published: false,
        status: 'draft',
        published_at: null,
      })
    },

    async toggleFeatured(id: number) {
      const post = this.posts.find(p => p.id === id)
      if (post) {
        return this.updatePost(id, { featured: !post.featured })
      }
    },

    setFilters(filters: PostFilterInput) {
      this.filters = filters
    },

    setSort(sort: PostSortInput) {
      this.sort = sort
    },

    clearFilters() {
      this.filters = {}
    },

    resetPagination() {
      this.pagination = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }
    },

    clearError() {
      this.error = null
    },
  },
})

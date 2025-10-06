import { defineStore } from 'pinia'
import type { Product, CreateProductInput, UpdateProductInput, ProductFilterInput, ProductSortInput } from '../types/product'

interface ProductState {
  products: Product[]
  currentProduct: Product | null
  loading: boolean
  error: string | null
  filters: ProductFilterInput
  sort: ProductSortInput
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const useProductsStore = defineStore('products', {
  state: (): ProductState => ({
    products: [],
    currentProduct: null,
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
    getProductById: (state) => (id: number) => {
      return state.products.find(item => item.id === id)
    },
  },

  actions: {
    async fetchProducts(page = 1, limit = 10) {
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
          data: Product[]
          pagination: {
            total: number
            page: number
            page_size: number
            total_pages: number
          }
        }>(`/products?${queryString}`)

        this.products = Array.isArray(response.data) ? response.data : []
        this.pagination = {
          total: response.pagination?.total || 0,
          page: response.pagination?.page || 1,
          limit: response.pagination?.page_size || 10,
          totalPages: response.pagination?.total_pages || 0,
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch products'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchProduct(id: number) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        const response = await api.get<{ data: Product }>(`/products/${id}`)
        this.currentProduct = response.data
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch product'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createProduct(data: CreateProductInput) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        const cleanData: any = { ...data }

        const response = await api.post<{ data: Product }>('/products', cleanData)

        this.products.unshift(response.data)
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to create product'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateProduct(id: number, data: UpdateProductInput) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        const cleanData: any = { ...data }

        const response = await api.put<{ data: Product }>(`/products/${id}`, cleanData)

        const index = this.products.findIndex(p => p.id === id)
        if (index !== -1) {
          this.products[index] = response.data
        }

        if (this.currentProduct?.id === id) {
          this.currentProduct = response.data
        }

        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to update product'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteProduct(id: number) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        await api.delete(`/products/${id}`)

        this.products = this.products.filter(p => p.id !== id)

        if (this.currentProduct?.id === id) {
          this.currentProduct = null
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to delete product'
        throw error
      } finally {
        this.loading = false
      }
    },

    setFilters(filters: ProductFilterInput) {
      this.filters = filters
    },

    setSort(sort: ProductSortInput) {
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

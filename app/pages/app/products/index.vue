<template>
  <UDashboardPanel>
    <template #body>
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Products</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Manage your products
            </p>
          </div>

          <CommonPermissionButton
            permission="product:create"
            icon="i-lucide-plus"
            @click="handleCreate"
          >
            Create Product
          </CommonPermissionButton>
        </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <UInput
        v-model="filters.search"
        icon="i-lucide-search"
        placeholder="Search products..."
        @update:model-value="applyFilters"
      />
    </div>

    <!-- Table -->
    <UCard>
      <ProductTable
        :products="products"
        :loading="loading"
        :pagination="pagination"
        @edit="handleEdit"
        @delete="handleDelete"
        @view="handleView"
        @page-change="handlePageChange"
      />
    </UCard>

    <!-- Form Modal -->
    <ProductFormModal
      v-model="showFormModal"
      :item="selectedItem"
      :loading="submitting"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <template #header>
        Delete Product
      </template>

      <template #body>
        <div class="space-y-4">
          <p>Are you sure you want to delete this product?</p>
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
import { useProductsStore } from '~/modules/products/stores/products'
import type { Product, CreateProductInput, UpdateProductInput } from '~/modules/products/types/product'
import ProductTable from '~/modules/products/components/ProductTable.vue'
import ProductFormModal from '~/modules/products/components/ProductFormModal.vue'

definePageMeta({
  layout: 'default',
})

const productsStore = useProductsStore()
const { products, loading, pagination } = storeToRefs(productsStore)
const toast = useToast()

const showFormModal = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref<Product | undefined>()
const deleting = ref(false)
const submitting = ref(false)

const filters = reactive({
  search: '',
})

const applyFilters = () => {
  productsStore.setFilters(filters)
  productsStore.fetchProducts()
}

const handleCreate = () => {
  selectedItem.value = undefined
  showFormModal.value = true
}

const handleEdit = (item: Product) => {
  selectedItem.value = item
  showFormModal.value = true
}

const handleView = (item: Product) => {
  navigateTo(`/app/products/${item.id}`)
}

const handleDelete = (item: Product) => {
  selectedItem.value = item
  showDeleteModal.value = true
}

const handleSubmit = async (data: CreateProductInput | UpdateProductInput) => {
  submitting.value = true
  try {
    if (selectedItem.value) {
      await productsStore.updateProduct(selectedItem.value.id, data as UpdateProductInput)
      toast.add({
        title: 'Success',
        description: 'Product updated successfully',
        color: 'success',
      })
    } else {
      await productsStore.createProduct(data as CreateProductInput)
      toast.add({
        title: 'Success',
        description: 'Product created successfully',
        color: 'success',
      })
    }
    showFormModal.value = false
    await productsStore.fetchProducts()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to save product',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async () => {
  if (!selectedItem.value) return

  deleting.value = true
  try {
    await productsStore.deleteProduct(selectedItem.value.id)
    toast.add({
      title: 'Success',
      description: 'Product deleted successfully',
      color: 'success',
    })
    showDeleteModal.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to delete product',
      color: 'error',
    })
  } finally {
    deleting.value = false
  }
}

const handlePageChange = (page: number) => {
  productsStore.fetchProducts(page)
}

onMounted(() => {
  productsStore.fetchProducts()
})
</script>

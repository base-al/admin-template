<template>
  <UDashboardPanel v-if="item">
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
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Details</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">View product information</p>
            </div>
          </div>

          <div class="flex gap-2">
            <CommonPermissionButton
              permission="product:update"
              icon="i-lucide-pencil"
              variant="outline"
              @click="handleEdit"
            >
              Edit
            </CommonPermissionButton>
            <CommonPermissionButton
              permission="product:delete"
              icon="i-lucide-trash"
              color="error"
              variant="outline"
              @click="handleDelete"
            >
              Delete
            </CommonPermissionButton>
          </div>
        </div>

    <!-- Content -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">Information</h2>
        </template>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400">Name</label>
            <p class="text-base font-medium">{{ item.name }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400">Price</label>
            <p class="text-base font-medium">{{ item.price }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400">Stock</label>
            <p class="text-base font-medium">{{ item.stock }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">Metadata</h2>
        </template>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400">Created At</label>
            <p class="text-base font-medium">{{ formatDateTime(item.created_at) }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-600 dark:text-gray-400">Updated At</label>
            <p class="text-base font-medium">{{ formatDateTime(item.updated_at) }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Delete Modal -->
    <UModal v-model="showDeleteModal">
      <template #header>
        Delete Product
      </template>

      <template #body>
        <div>
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
        <p class="text-lg text-gray-500 dark:text-gray-400">Product not found</p>
        <UButton @click="goBack">Go Back</UButton>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProductsStore } from '~/modules/products/stores/products'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const toast = useToast()

const item = ref()
const loading = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)

const id = computed(() => parseInt(route.params.id as string))

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const goBack = () => {
  router.push('/app/products')
}

const handleEdit = () => {
  // Navigate to edit page or open modal
  router.push(`/app/products/${id.value}/edit`)
}

const handleDelete = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await productsStore.deleteProduct(id.value)
    toast.add({
      title: 'Success',
      description: 'Product deleted successfully',
      color: 'success',
    })
    router.push('/app/products')
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

onMounted(async () => {
  loading.value = true
  try {
    item.value = await productsStore.fetchProduct(id.value)
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to fetch product',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
})
</script>

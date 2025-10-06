<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'max-w-4xl' }">
    <template #header>
      {{ isEdit ? 'Edit Product' : 'Create Product' }}
    </template>
    <template #body>
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Basic Information</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Name" required class="sm:col-span-2">
            <UInput
              v-model="form.name"
              placeholder="Enter name"
            />
          </UFormField>

          <UFormField label="Price" required>
            <UInput
              v-model="form.price"
              type="number"
              placeholder="Enter price"
            />
          </UFormField>

          <UFormField label="Stock" required>
            <UInput
              v-model="form.stock"
              type="number"
              placeholder="Enter stock"
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
import type { CreateProductInput, UpdateProductInput, Product } from '../types/product'

const props = defineProps<{
  modelValue: boolean
  item?: Product
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: CreateProductInput | UpdateProductInput]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEdit = computed(() => !!props.item)

const form = ref<CreateProductInput>({
  name: '',
  price: 0,
  stock: 0,
})

const handleSubmit = () => {
  emit('submit', form.value)
}

const closeModal = () => {
  isOpen.value = false
  resetForm()
}

const resetForm = () => {
  form.value = {
    name: '',
    price: 0,
    stock: 0,
  }
}

// Watch for item prop changes
watch(() => props.item, (item) => {
  if (item) {
    form.value = {
      name: item.name,
      price: item.price,
      stock: item.stock,
    }
  } else {
    resetForm()
  }
}, { immediate: true })
</script>

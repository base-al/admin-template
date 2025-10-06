<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'max-w-4xl' }">
    <template #header>
      {{ isEdit ? 'Edit Tag' : 'Create Tag' }}
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

          <UFormField label="Slug" required class="sm:col-span-2">
            <UInput
              v-model="form.slug"
              placeholder="Enter slug"
            />
          </UFormField>

          <UFormField label="Description" required class="sm:col-span-2">
            <UTextarea
              v-model="form.description"
              placeholder="Enter description"
              :rows="3"
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
import type { CreateTagInput, UpdateTagInput, Tag } from '../types/tag'

const props = defineProps<{
  modelValue: boolean
  item?: Tag
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: CreateTagInput | UpdateTagInput]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEdit = computed(() => !!props.item)

const form = ref<CreateTagInput>({
  name: '',
  slug: '',
  description: '',
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
    slug: '',
    description: '',
  }
}

// Watch for item prop changes
watch(() => props.item, (item) => {
  if (item) {
    form.value = {
      name: item.name,
      slug: item.slug,
      description: item.description,
    }
  } else {
    resetForm()
  }
}, { immediate: true })
</script>

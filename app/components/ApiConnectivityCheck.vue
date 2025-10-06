<template>
  <div v-if="showLoadingState" class="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"/>
      <p class="text-gray-600">Checking server connection...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

const showLoadingState = computed(() => props.show)
</script>
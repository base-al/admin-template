<template>
  <UButton
    v-if="hasPermission"
    v-bind="$attrs"
  >
    <slot />
  </UButton>
</template>

<script setup lang="ts">
interface Props {
  permission: string // Format: "resource:action" e.g. "customers:create"
  resourceId?: string // Optional for resource-specific permissions
}

const props = defineProps<Props>()

// Get authorization composable
const { hasPermission: checkPermission } = useAuthorization()

// Parse permission string
const [resourceType, action] = props.permission.split(':')

// Check permission reactively
const hasPermission = computed(() => {
  if (!resourceType || !action) {
    console.warn(`Invalid permission format: ${props.permission}. Expected "resource:action"`)
    return false
  }
  
  try {
    return checkPermission(resourceType, action)
  } catch (error) {
    console.warn(`Permission check failed for ${props.permission}:`, error)
    return false
  }
})

// Make component transparent to attributes
defineOptions({
  inheritAttrs: false
})
</script>
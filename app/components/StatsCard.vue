<template>
  <UCard>
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div 
          class="w-12 h-12 rounded-lg flex items-center justify-center"
          :class="iconBackgroundClass"
        >
          <UIcon 
            :name="icon" 
            class="w-6 h-6"
            :class="iconClass"
          />
        </div>
      </div>
      <div class="ml-4 flex-1">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              {{ title }}
            </p>
            <div v-if="loading" class="mt-1">
              <USkeleton class="h-6 w-16" />
            </div>
            <p v-else class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ value }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
 
type Props = {
  title: string
  value: string | number
  icon: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  loading: false
})

const iconBackgroundClass = computed(() => {
  const classes = {
    blue: 'bg-blue-100 dark:bg-blue-900',
    green: 'bg-green-100 dark:bg-green-900',
    purple: 'bg-purple-100 dark:bg-purple-900',
    orange: 'bg-orange-100 dark:bg-orange-900',
    red: 'bg-red-100 dark:bg-red-900'
  }
  return classes[props.color]
})

const iconClass = computed(() => {
  const classes = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400'
  }
  return classes[props.color]
})
</script>
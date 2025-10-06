<template>
  <UCard>
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ value }}</p>
        <div v-if="trend" class="flex items-center mt-1">
          <UIcon 
            :name="trendDirection === 'up' ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
            :class="[
              'size-4 mr-1',
              trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
            ]"
          />
          <span 
            :class="[
              'text-sm font-medium',
              trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
            ]"
          >
            {{ trend }}
          </span>
        </div>
      </div>
      <div class="flex-shrink-0">
        <div 
          :class="[
            'w-12 h-12 rounded-lg flex items-center justify-center',
            'bg-primary-50 dark:bg-primary-900/20'
          ]"
        >
          <UIcon 
            :name="icon" 
            class="size-6 text-primary-600 dark:text-primary-400" 
          />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon: string
  trend?: string
  trendDirection?: 'up' | 'down'
}>()
</script>
<script setup lang="ts">
export interface StatCardProps {
  title: string
  value: string | number
  icon: string
  iconColor?: string
  trend?: {
    value: number
    label: string
    type: 'up' | 'down' | 'neutral'
  }
  loading?: boolean
  description?: string
  href?: string
}

const props = withDefaults(defineProps<StatCardProps>(), {
  iconColor: 'text-primary',
  loading: false
})

const trendIcon = computed(() => {
  if (!props.trend) return ''
  switch (props.trend.type) {
    case 'up': return 'i-lucide-trending-up'
    case 'down': return 'i-lucide-trending-down'
    default: return 'i-lucide-minus'
  }
})

const trendColor = computed(() => {
  if (!props.trend) return ''
  switch (props.trend.type) {
    case 'up': return 'text-green-500'
    case 'down': return 'text-red-500'
    default: return 'text-gray-500'
  }
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return new Intl.NumberFormat().format(props.value)
  }
  return props.value
})
</script>

<template>
  <UCard :to="href" class="hover:shadow-lg transition-shadow">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <UIcon 
            :name="icon" 
            :class="[iconColor, 'text-lg']"
          />
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
            {{ title }}
          </h3>
        </div>
        
        <div class="space-y-1">
          <div v-if="loading" class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div v-else class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ formattedValue }}
          </div>
          
          <div v-if="trend" class="flex items-center gap-1 text-xs">
            <UIcon 
              :name="trendIcon" 
              :class="[trendColor, 'text-xs']"
            />
            <span :class="trendColor">
              {{ trend.value }}%
            </span>
            <span class="text-gray-500">
              {{ trend.label }}
            </span>
          </div>
          
          <p v-if="description" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ description }}
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
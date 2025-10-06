<script setup lang="ts">
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { Period, Range } from '~/types'
import { useElementSize } from '@vueuse/core' 

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  period: Period
  range: Range
  title?: string
  dataType?: 'revenue' | 'tickets' | 'network' | 'performance'
}>()

type DataRecord = {
  date: Date
  amount: number
}

const { width } = useElementSize(cardRef)

const data = ref<DataRecord[]>([])

// Configuration for different chart types
const chartConfig = computed(() => {
  switch (props.dataType) {
    case 'tickets':
      return {
        title: props.title || 'Ticket Volume',
        min: 5,
        max: 50,
        formatter: new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format,
        suffix: ' tickets'
      }
    case 'network':
      return {
        title: props.title || 'Network Performance',
        min: 85,
        max: 100,
        formatter: (value: number) => `${value.toFixed(1)}%`,
        suffix: ' uptime'
      }
    case 'performance':
      return {
        title: props.title || 'Performance Metrics',
        min: 70,
        max: 100,
        formatter: (value: number) => `${value.toFixed(1)}%`,
        suffix: ' efficiency'
      }
    default: // revenue
      return {
        title: props.title || 'Revenue',
        min: 1000,
        max: 10000,
        formatter: new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format,
        suffix: ''
      }
  }
})

watch([() => props.period, () => props.range], () => {
  const dates = ({
    daily: eachDayOfInterval,
    weekly: eachWeekOfInterval,
    monthly: eachMonthOfInterval
  } as Record<Period, typeof eachDayOfInterval>)[props.period](props.range)

  const { min, max } = chartConfig.value

  data.value = dates.map(date => ({ 
    date, 
    amount: Math.floor(Math.random() * (max - min + 1)) + min 
  }))
}, { immediate: true })

const x = (_: DataRecord, i: number) => i
const y = (d: DataRecord) => d.amount

const total = computed(() => data.value.reduce((acc: number, { amount }) => acc + amount, 0))

const formatValue = (value: number): string => {
  return chartConfig.value.formatter(value)
}

const formatDate = (date: Date): string => {
  return ({
    daily: format(date, 'd MMM'),
    weekly: format(date, 'd MMM'),
    monthly: format(date, 'MMM yyy')
  })[props.period]
}

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) {
    return ''
  }

  return formatDate(data.value[i].date)
}

const template = (d: DataRecord) => `${formatDate(d.date)}: ${formatValue(d.amount)}`
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">
          {{ chartConfig.title }}
        </p>
        <p class="text-3xl text-highlighted font-semibold">
          {{ formatValue(total) }}
        </p>
      </div>
    </template>

    <VisXYContainer
      :data="data"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine
        :x="x"
        :y="y"
        color="var(--ui-primary)"
      />
      <VisArea
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :opacity="0.1"
      />

      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
      />

      <VisCrosshair
        color="var(--ui-primary)"
        :template="template"
      />

      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
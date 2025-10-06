<template>
  <div class="permission-manager space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Manage Permissions
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select permissions for the {{ role.name }} role
        </p>
      </div>
      
      <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>{{ selectedPermissions.length }} of {{ availablePermissions.length }} selected</span>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <UInput
          v-model="searchQuery"
          placeholder="Search permissions..."
          icon="i-lucide-search"
        />
      </div>
      
      <USelectMenu
        v-model="resourceFilter"
        :options="resourceFilterOptions"
        placeholder="Filter by resource"
        class="w-48"
      />
      
      <USelectMenu
        v-model="actionFilter"
        :options="actionFilterOptions"
        placeholder="Filter by action"
        class="w-40"
      />
    </div>

    <!-- Quick Selection Actions -->
    <div class="flex flex-wrap gap-2">
      <UButton
        size="sm"
        variant="outline"
        icon="i-lucide-check-circle"
        @click="selectAll"
      >
        Select All
      </UButton>
      
      <UButton
        size="sm"
        variant="outline"
        icon="i-lucide-x-circle"
        @click="selectNone"
      >
        Select None
      </UButton>
      
      <UButton
        size="sm"
        variant="outline"
        @click="selectByResource('employees')"
      >
        Employee Permissions
      </UButton>
      
      <UButton
        size="sm"
        variant="outline"
        @click="selectByResource('customers')"
      >
        Customer Permissions
      </UButton>
      
      <UButton
        size="sm"
        variant="outline"
        @click="selectByResource('orders')"
      >
        Order Permissions
      </UButton>
    </div>

    <!-- Permissions Grid -->
    <div class="permission-grid max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <div class="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="permission in filteredPermissions"
          :key="permission.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div class="flex items-start space-x-3">
            <UCheckbox
              :model-value="isPermissionSelected(permission.id)"
              class="mt-1"
              @update:model-value="togglePermission(permission.id, $event)"
            />
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ permission.name }}
                </h4>
                
                <UBadge
                  :label="permission.resource"
                  :color="getResourceColor(permission.resource)"
                  variant="soft"
                  size="xs"
                />
                
                <UBadge
                  :label="permission.action"
                  color="neutral"
                  variant="soft"
                  size="xs"
                />
              </div>
              
              <p v-if="permission.description" class="text-sm text-gray-600 dark:text-gray-400">
                {{ permission.description }}
              </p>
              
              <div class="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Resource: {{ permission.resource }}</span>
                <span>Action: {{ permission.action }}</span>
                <span v-if="permission.resource_type">Type: {{ permission.resource_type }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredPermissions.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-search-x" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">No permissions found</h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Try adjusting your search or filter criteria.
      </p>
    </div>

    <!-- Summary -->
    <div v-if="selectedPermissions.length > 0" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
            {{ selectedPermissions.length }} permissions selected
          </h4>
          <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
            These permissions will be assigned to the {{ role.name }} role.
          </p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <UButton
        :loading="loading"
        :disabled="!hasChanges"
        @click="handleSave"
      >
        Save Permissions
      </UButton>
      
      <UButton
        variant="outline"
        :disabled="loading"
        @click="handleCancel"
      >
        Cancel
      </UButton>
      
      <div class="flex-1" />
      
      <p class="text-sm text-gray-500 dark:text-gray-400 self-center">
        {{ selectedPermissions.length }} of {{ availablePermissions.length }} permissions selected
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Role } from '~/types'

// ===== PROPS =====
interface Props {
  role: Role
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// ===== EMITS =====
interface Emits {
  'save': [permissionIds: number[]]
  'cancel': []
}

const emit = defineEmits<Emits>()

// ===== COMPOSABLES =====
const employeeModule = useEmployeeModule()

// ===== REACTIVE STATE =====
const searchQuery = ref('')
const resourceFilter = ref<string | null>(null)
const actionFilter = ref<string | null>(null)
const selectedPermissions = ref<number[]>([])
const initialPermissions = ref<number[]>([])

// ===== COMPUTED PROPERTIES =====
const availablePermissions = computed(() => employeeModule.permissions.value)

const filteredPermissions = computed(() => {
  let filtered = [...availablePermissions.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(permission =>
      permission.name.toLowerCase().includes(query) ||
      permission.resource.toLowerCase().includes(query) ||
      permission.action.toLowerCase().includes(query) ||
      permission.description?.toLowerCase().includes(query)
    )
  }

  // Resource filter
  if (resourceFilter.value) {
    filtered = filtered.filter(permission => permission.resource === resourceFilter.value)
  }

  // Action filter
  if (actionFilter.value) {
    filtered = filtered.filter(permission => permission.action === actionFilter.value)
  }

  return filtered
})

const resourceFilterOptions = computed(() => {
  const resources = [...new Set(availablePermissions.value.map(p => p.resource))]
  return [
    { label: 'All Resources', value: null },
    ...resources.map(resource => ({
      label: resource.charAt(0).toUpperCase() + resource.slice(1),
      value: resource
    }))
  ]
})

const actionFilterOptions = computed(() => {
  const actions = [...new Set(availablePermissions.value.map(p => p.action))]
  return [
    { label: 'All Actions', value: null },
    ...actions.map(action => ({
      label: action.charAt(0).toUpperCase() + action.slice(1),
      value: action
    }))
  ]
})

const hasChanges = computed(() => {
  return JSON.stringify([...selectedPermissions.value].sort()) !== 
         JSON.stringify([...initialPermissions.value].sort())
})

// ===== METHODS =====
const initializePermissions = () => {
  const currentPermissions = props.role.permissions?.map(p => p.id) || []
  selectedPermissions.value = [...currentPermissions]
  initialPermissions.value = [...currentPermissions]
}

const isPermissionSelected = (permissionId: number): boolean => {
  return selectedPermissions.value.includes(permissionId)
}

const togglePermission = (permissionId: number, selected: boolean) => {
  if (selected) {
    if (!selectedPermissions.value.includes(permissionId)) {
      selectedPermissions.value.push(permissionId)
    }
  } else {
    const index = selectedPermissions.value.indexOf(permissionId)
    if (index > -1) {
      selectedPermissions.value.splice(index, 1)
    }
  }
}

const selectAll = () => {
  selectedPermissions.value = filteredPermissions.value.map(p => p.id)
}

const selectNone = () => {
  // Only remove permissions that are currently visible in filtered results
  const visiblePermissionIds = filteredPermissions.value.map(p => p.id)
  selectedPermissions.value = selectedPermissions.value.filter(id => 
    !visiblePermissionIds.includes(id)
  )
}

const selectByResource = (resource: string) => {
  const resourcePermissions = availablePermissions.value
    .filter(p => p.resource === resource)
    .map(p => p.id)
  
  // Add these permissions to selected (don't replace all)
  resourcePermissions.forEach(id => {
    if (!selectedPermissions.value.includes(id)) {
      selectedPermissions.value.push(id)
    }
  })
}

const getResourceColor = (resource: string): string => {
  const colors: Record<string, string> = {
    'employees': 'blue',
    'customers': 'green',
    'orders': 'yellow',
    'plans': 'purple',
    'payments': 'orange',
    'settings': 'gray',
    'reports': 'pink'
  }
  return colors[resource] || 'gray'
}

const handleSave = () => {
  emit('save', [...selectedPermissions.value])
}

const handleCancel = () => {
  selectedPermissions.value = [...initialPermissions.value]
  emit('cancel')
}

// ===== LIFECYCLE =====
onMounted(async () => {
  // Fetch permissions if not already loaded
  if (employeeModule.permissions.value.length === 0) {
    await employeeModule.fetchPermissions()
  }
  
  initializePermissions()
})

// Watch for role changes
watch(() => props.role, initializePermissions, { immediate: true })
</script>

<style scoped>
.permission-grid {
  background: white;
  @apply dark:bg-gray-900;
}
</style>
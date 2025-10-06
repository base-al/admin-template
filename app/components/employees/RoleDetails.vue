<template>
  <div class="role-details space-y-6">
    <!-- Role Header -->
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ role.name }}
        </h3>
        <p v-if="role.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ role.description }}
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <UBadge
          v-if="role.is_system"
          label="System"
          color="warning"
          variant="soft"
        />
        <UBadge
          v-else
          label="Custom"
          color="success"
          variant="soft"
        />
      </div>
    </div>

    <!-- Role Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-4">
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Created
          </label>
          <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
            {{ formatDate(role.created_at) }}
          </p>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Last Updated
          </label>
          <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
            {{ formatDate(role.updated_at) }}
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Permission Count
          </label>
          <div class="flex items-center gap-2 mt-1">
            <UIcon name="i-lucide-key" class="w-4 h-4 text-blue-500" />
            <span class="text-sm text-gray-900 dark:text-gray-100">
              {{ role.permission_count || 0 }} permissions
            </span>
          </div>
        </div>

        <div v-if="role.is_system">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Type
          </label>
          <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
            System role - cannot be deleted
          </p>
        </div>
      </div>
    </div>

    <!-- Permissions Preview -->
    <div v-if="role.permissions && role.permissions.length > 0" class="space-y-3">
      <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Assigned Permissions
      </label>
      
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            v-for="permission in role.permissions"
            :key="permission.id"
            class="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-green-500" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ permission.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ permission.resource }} • {{ permission.action }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State for Permissions -->
    <div v-else class="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
      <UIcon name="i-lucide-key-off" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">No permissions assigned</h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        This role doesn't have any permissions assigned yet.
      </p>
      <UButton
        v-if="canManagePermissions"
        variant="outline"
        size="sm"
        class="mt-3"
        @click="$emit('manage-permissions', role)"
      >
        Assign Permissions
      </UButton>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <UButton
        v-if="canEditRole"
        icon="i-lucide-pencil"
        @click="$emit('edit', role)"
      >
        Edit Role
      </UButton>

      <UButton
        v-if="canManagePermissions"
        icon="i-lucide-settings"
        variant="outline"
        @click="$emit('manage-permissions', role)"
      >
        Manage Permissions
      </UButton>

      <div class="flex-1" />

      <UButton
        variant="ghost"
        @click="$emit('close')"
      >
        Close
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Role } from '~/types'

// ===== PROPS =====
interface Props {
  role: Role
}

const props = defineProps<Props>()

// ===== EMITS =====
interface Emits {
  'close': []
  'edit': [role: Role]
  'manage-permissions': [role: Role]
}

defineEmits<Emits>()

// ===== COMPOSABLES =====
const { formatDate } = useDateFormat()
const authorization = useAuthorization()

// ===== COMPUTED PROPERTIES =====
const canEditRole = computed(() => {
  return !props.role.is_system && authorization.can('update', 'roles', props.role.id.toString())
})

const canManagePermissions = computed(() => {
  return authorization.can('manage', 'role-permissions', props.role.id.toString())
})
</script>
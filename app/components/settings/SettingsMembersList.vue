<script setup lang="ts">
import type { Employee } from '~/types'

interface Props {
  members: Employee[]
}

const props = defineProps<Props>()

// Use authorization composable
const { permissions } = useAuthorization()

const columns = [
  {
    key: 'name',
    label: 'Name'
  },
  {
    key: 'username', 
    label: 'Username'
  },
  {
    key: 'email',
    label: 'Email'
  },
  {
    key: 'role_name',
    label: 'Role'
  },
  {
    key: 'created_at',
    label: 'Created'
  },
  {
    key: 'actions',
    label: 'Actions'
  }
]

// Transform employees to include computed name field
const employeesWithDisplayName = computed(() => {
  return props.members.map(employee => ({
    ...employee,
    name: `${employee.first_name} ${employee.last_name}`.trim()
  }))
})

// Actions
const editEmployee = async (employee: Employee) => {
  const canEdit = await permissions.canEditEmployee(employee.id.toString())
  if (!canEdit) {
    console.warn('User does not have permission to edit this employee')
    return
  }
  // TODO: Open edit modal
  console.log('Edit employee:', employee)
}

const deleteEmployee = async (employee: Employee) => {
  const canDelete = await permissions.canDeleteEmployee(employee.id.toString())
  if (!canDelete) {
    console.warn('User does not have permission to delete this employee')
    return
  }
  // TODO: Confirm and delete employee
  console.log('Delete employee:', employee)
}

// Create reactive permission maps for each employee
const employeePermissions = computed(() => {
  const permissionMap = new Map()
  
  props.members.forEach(employee => {
    permissionMap.set(employee.id, {
      canEdit: ref(false),
      canDelete: ref(false)
    })
    
    // Check permissions asynchronously
    permissions.canEditEmployee(employee.id.toString()).then(canEdit => {
      permissionMap.get(employee.id).canEdit.value = canEdit
    })
    
    permissions.canDeleteEmployee(employee.id.toString()).then(canDelete => {
      permissionMap.get(employee.id).canDelete.value = canDelete
    })
  })
  
  return permissionMap
})

// Helper functions to get permissions for a specific employee
const canEditEmployee = (employee: Employee) => {
  return employeePermissions.value.get(employee.id)?.canEdit?.value || false
}

const canDeleteEmployee = (employee: Employee) => {
  return employeePermissions.value.get(employee.id)?.canDelete?.value || false
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <UTable
    :rows="employeesWithDisplayName"
    :columns="columns"
    :loading="false"
    class="w-full"
    :ui="{
      td: 'whitespace-nowrap',
      th: 'whitespace-nowrap'
    }"
  >
    <template #name-data="{ row }">
      <div class="flex items-center gap-3">
        <UAvatar
          :src="row.avatar_url"
          :alt="row.name"
          size="sm"
        />
        <div>
          <p class="font-medium text-gray-900">{{ row.name }}</p>
          <p class="text-sm text-gray-500">{{ row.phone }}</p>
        </div>
      </div>
    </template>

    <template #username-data="{ row }">
      <span class="text-gray-900 font-mono text-sm">{{ row.username }}</span>
    </template>

    <template #email-data="{ row }">
      <span class="text-gray-600">{{ row.email }}</span>
    </template>

    <template #role_name-data="{ row }">
      <UBadge
        :label="row.role_name || 'No Role'"
        :color="row.role_name ? 'info' : 'neutral'"
        variant="subtle"
      />
    </template>

    <template #created_at-data="{ row }">
      <span class="text-gray-500 text-sm">{{ formatDate(row.created_at) }}</span>
    </template>

    <template #actions-data="{ row }">
      <div class="flex items-center gap-1">
        <UButton
          v-if="canEditEmployee(row)"
          icon="i-lucide-pencil"
          size="sm"
          color="primary"
          variant="ghost"
          @click="editEmployee(row)"
        />
        <UButton
          v-if="canDeleteEmployee(row)"
          icon="i-lucide-trash-2"
          size="sm"
          color="error"
          variant="ghost"
          @click="deleteEmployee(row)"
        />
        <span 
          v-if="!canEditEmployee(row) && !canDeleteEmployee(row)"
          class="text-xs text-gray-400"
        >
          No actions available
        </span>
      </div>
    </template>

    <template #empty-state>
      <div class="flex flex-col items-center justify-center py-6 gap-3">
        <UIcon name="i-lucide-users" class="w-8 h-8 text-gray-400" />
        <p class="text-sm text-gray-500">No employees found</p>
      </div>
    </template>
  </UTable>
</template>
<script setup lang="ts">
</script>

<template>
  <UDashboardPanel id="employees" :ui="{ body: 'lg:py-8' }">
    <template #header>
      <UDashboardNavbar title="Employee Management">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <CommonPermissionButton
              permission="employee:read"
              icon="i-lucide-users"
              color="primary"
              variant="ghost"
              to="/app/employees"
              size="sm"
            >
              Employees
            </CommonPermissionButton>
            <CommonPermissionButton
              permission="authorization:list"
              icon="i-lucide-shield"
              color="primary"
              variant="ghost"
              to="/app/employees/roles"
              size="sm"
            >
              Roles
            </CommonPermissionButton>
            <CommonPermissionButton
              permission="authorization:list"
              icon="i-lucide-key"
              color="primary"
              variant="ghost"
              to="/app/employees/roles/permissions"
              size="sm"
            >
              Permissions
            </CommonPermissionButton>
          </div>
        </template>
      </UDashboardNavbar>

    </template>

    <template #body>
      <div class="flex flex-col gap-6 w-full mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
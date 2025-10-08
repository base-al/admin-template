/**
 * Module Registry
 *
 * Automatically discovers and registers all modules.
 * Each module should export a default config from module.config.ts
 */

import type { NavigationMenuItem } from '@nuxt/ui'

export interface ModuleNavigation extends NavigationMenuItem {
  permission?: string
  order?: number
}

export interface ModuleConfig {
  name: string
  displayName: string
  description?: string
  icon?: string
  routes?: {
    list?: string
    create?: string
    view?: string
    edit?: string
  }
  permissions?: {
    view?: string
    create?: string
    update?: string
    delete?: string
    list?: string
  }
  navigation?: ModuleNavigation
}

// Import all module configs
const moduleFiles = import.meta.glob('./*/module.config.ts', { eager: true })

// Extract module configs
const modules: ModuleConfig[] = []

for (const path in moduleFiles) {
  const module = moduleFiles[path] as { default?: ModuleConfig }
  if (module.default) {
    modules.push(module.default)
  }
}

/**
 * Get all navigation items from modules
 * Sorted by order (if specified)
 */
export function getModuleNavigationItems(): ModuleNavigation[] {
  return modules
    .filter(m => m.navigation)
    .map(m => ({
      ...m.navigation!,
      label: m.navigation!.label || m.displayName,
      icon: m.navigation!.icon || m.icon || 'i-lucide-folder',
    }))
    .sort((a, b) => (a.order || 999) - (b.order || 999))
}

/**
 * Get module by name
 */
export function getModule(name: string): ModuleConfig | undefined {
  return modules.find(m => m.name === name)
}

/**
 * Get all registered modules
 */
export function getAllModules(): ModuleConfig[] {
  return modules
}

export default modules

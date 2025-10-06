// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([
  // Custom config for type definition files
  {
    files: ['app/types/**/*.ts'],
    rules: {
      // Allow any in type definition files for flexible interfaces like Record<string, any>
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  // Custom config for BaseTable component (generic table component needs flexible typing)
  {
    files: ['app/components/base/BaseTable.vue'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
])

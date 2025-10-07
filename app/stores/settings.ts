import { defineStore } from 'pinia'
import type { Setting, SettingUpdate } from '~/types'

interface SettingsState {
  settings: Setting[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

export const useSettingsStore = defineStore('settings', {
  
  state: (): SettingsState => ({
    settings: [],
    isLoading: false,
    isSaving: false,
    error: null
  }),

  getters: {
    // Get settings by group
    getByGroup: (state) => (group: string) => 
      state.settings.filter(s => s.group === group),
    
    // Get setting by key
    getByKey: (state) => (key: string) => 
      state.settings.find(s => s.setting_key === key),
    
    // Get company settings
    companySettings: (state) => 
      state.settings.filter(s => s.group === 'company'),
    
    // Get financial settings  
    financialSettings: (state) => 
      state.settings.filter(s => s.group === 'financial'),
    
    // Get system settings
    systemSettings: (state) => 
      state.settings.filter(s => s.group === 'system'),
    
    // Get email settings
    emailSettings: (state) => 
      state.settings.filter(s => s.group === 'email'),
    
    // Get service settings
    serviceSettings: (state) => 
      state.settings.filter(s => s.group === 'service'),
    
    // Helper getters for specific values
    companyName: (state) =>
      state.settings.find(s => s.setting_key === 'company_name')?.value_string || 'Base',

    vatRate: (state) =>
      state.settings.find(s => s.setting_key === 'vat_rate')?.value_float || 0.18,

    maintenanceMode: (state) =>
      state.settings.find(s => s.setting_key === 'maintenance_mode')?.value_bool || false,

    invoicePrefix: (state) =>
      state.settings.find(s => s.setting_key === 'invoice_prefix')?.value_string || 'INV'
  },

  actions: {
    // Fetch all settings
    async fetchSettings() {
      this.isLoading = true
      this.error = null
      
      try {
        const api = useApi()
        const response = await api.get('/settings?limit=1000')
        
        this.settings = (response as { data: Setting[] }).data || []
      } catch (error: unknown) {
        this.error = error as string || 'Failed to fetch settings'
        console.error('Error fetching settings:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Update a setting
    async updateSetting(id: number, data: SettingUpdate) {
      this.isSaving = true
      this.error = null
      
      try {
        const api = useApi()
        const response = await api.put(`/settings/${id}`, data)
        
        // Update the setting in the store
        const index = this.settings.findIndex(s => s.id === id)
        if (index !== -1) {
          this.settings[index] = { ...this.settings[index], ...(response as Setting) }
        }
        
        return response
      } catch (error: unknown) {
        this.error = error as string || 'Failed to update setting'
        console.error('Error updating setting:', error)
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // Update multiple settings (bulk update)
    async updateSettings(updates: Array<{ id: number; data: SettingUpdate }>) {
      this.isSaving = true
      this.error = null
      
      try {
        const api = useApi()
        const promises = updates.map(({ id, data }) => 
          api.put(`/settings/${id}`, data)
        )
        
        const responses = await Promise.all(promises)
        
        // Update settings in the store
        responses.forEach((response, index) => {
          const update = updates[index]
          if (update) {
            const settingIndex = this.settings.findIndex(s => s.id === update.id)
            if (settingIndex !== -1 && response) {
              const setting = this.settings[settingIndex]
              if (setting) {
                Object.assign(setting, response as Partial<Setting>)
              }
            }
          }
        })
        
        return responses
      } catch (error: unknown) {
        this.error = error as string || 'Failed to update settings'
        console.error('Error updating settings:', error)
        throw error
      } finally {
        this.isSaving = false
      }
    },

    // Update company settings
    async updateCompanySettings(formData: {
      company_name: string
      company_address: string
      company_phone: string
      company_email: string
      company_website?: string
      company_nui: string
    }) {
      const updates = Object.entries(formData).map(([key, value]) => {
        const setting = this.settings.find(s => s.setting_key === key)
        if (setting && value !== undefined) {
          return {
            id: setting.id,
            data: {
              setting_key: key,
              label: setting.label,
              group: 'company',
              type: 'string',
              value_string: value as string,
              description: setting.description,
              is_public: setting.is_public
            }
          }
        }
        return null
      }).filter(Boolean) as Array<{ id: number; data: SettingUpdate }>

      return this.updateSettings(updates)
    },

    // Update financial settings
    async updateFinancialSettings(formData: {
      vat_rate: number
      default_payment_terms: number
    }) {
      const updates = []
      
      // VAT rate
      const vatSetting = this.settings.find(s => s.setting_key === 'vat_rate')
      if (vatSetting) {
        updates.push({
          id: vatSetting.id,
          data: {
            setting_key: 'vat_rate',
            label: vatSetting.label,
            group: 'financial',
            type: 'float',
            value_float: formData.vat_rate,
            description: vatSetting.description,
            is_public: vatSetting.is_public
          }
        })
      }
      
      // Payment terms
      const paymentSetting = this.settings.find(s => s.setting_key === 'default_payment_terms')
      if (paymentSetting) {
        updates.push({
          id: paymentSetting.id,
          data: {
            setting_key: 'default_payment_terms',
            label: paymentSetting.label,
            group: 'financial',
            type: 'int',
            value_int: formData.default_payment_terms,
            description: paymentSetting.description,
            is_public: paymentSetting.is_public
          }
        })
      }
      
      return this.updateSettings(updates)
    },

    // Update system settings
    async updateSystemSettings(formData: {
      invoice_prefix: string
      grace_period_days: number
      auto_suspend_after_days: number
      maintenance_mode: boolean
    }) {
      const updates = Object.entries(formData).map(([key, value]) => {
        const setting = this.settings.find(s => s.setting_key === key && s.group === 'system')
        if (setting) {
          const data: SettingUpdate = {
            setting_key: key,
            label: setting.label,
            group: 'system',
            type: setting.type,
            description: setting.description,
            is_public: setting.is_public
          }
          
          // Set appropriate value field based on type
          if (setting.type === 'string') {
            data.value_string = value as string
          } else if (setting.type === 'int') {
            data.value_int = value as number
          } else if (setting.type === 'bool') {
            data.value_bool = value as boolean
          }
          
          return { id: setting.id, data }
        }
        return null
      }).filter(Boolean) as Array<{ id: number; data: SettingUpdate }>

      return this.updateSettings(updates)
    },

    // Update email settings
    async updateEmailSettings(formData: {
      email_from_name: string
      email_signature: string
    }) {
      const updates = Object.entries(formData).map(([key, value]) => {
        const setting = this.settings.find(s => s.setting_key === key)
        if (setting) {
          return {
            id: setting.id,
            data: {
              setting_key: key,
              label: setting.label,
              group: 'email',
              type: 'string',
              value_string: value,
              description: setting.description,
              is_public: setting.is_public
            }
          }
        }
        return null
      }).filter(Boolean) as Array<{ id: number; data: SettingUpdate }>

      return this.updateSettings(updates)
    },

    // Update service settings
    async updateServiceSettings(formData: {
      service_activation_auto: boolean
    }) {
      const setting = this.settings.find(s => s.setting_key === 'service_activation_auto')
      if (setting) {
        return this.updateSetting(setting.id, {
          setting_key: 'service_activation_auto',
          label: setting.label,
          group: 'service',
          type: 'bool',
          value_bool: formData.service_activation_auto,
          description: setting.description,
          is_public: setting.is_public
        })
      }
    },

    // Update multiple settings by key
    async updateMultipleSettings(settingUpdates: Array<{
      setting_key: string
      value_string: string
      value_int: number
      value_bool: boolean
      value_float: number
    }>) {
      const updates = settingUpdates.map(update => {
        const setting = this.settings.find(s => s.setting_key === update.setting_key)
        if (setting) {
          const data: SettingUpdate = {
            setting_key: update.setting_key,
            label: setting.label,
            group: setting.group,
            type: setting.type,
            description: setting.description,
            is_public: setting.is_public
          }
          
          // Set appropriate value field based on type
          if (setting.type === 'string') {
            data.value_string = update.value_string
          } else if (setting.type === 'int') {
            data.value_int = update.value_int
          } else if (setting.type === 'float') {
            data.value_float = update.value_float
          } else if (setting.type === 'bool') {
            data.value_bool = update.value_bool
          }
          
          return { id: setting.id, data }
        }
        return null
      }).filter(Boolean) as Array<{ id: number; data: SettingUpdate }>

      return this.updateSettings(updates)
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})
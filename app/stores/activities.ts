import { defineStore } from 'pinia'
import type { Activity } from '~/types/activity'

interface ActivitiesState {
  activities: Activity[]
  loading: boolean
  error: string | null
}

export const useActivitiesStore = defineStore('activities', {
  state: (): ActivitiesState => ({
    activities: [],
    loading: false,
    error: null,
  }),

  getters: {
    recentActivities: (state) => state.activities.slice(0, 10),
  },

  actions: {
    async fetchRecentActivities(limit = 10) {
      this.loading = true
      this.error = null

      try {
        const response = await $fetch<Activity[]>(`/api/activities/recent?limit=${limit}`)
        this.activities = response
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch recent activities'
        console.error('Failed to fetch activities:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchActivitiesByUser(userId: number, limit = 10) {
      this.loading = true
      this.error = null

      try {
        const response = await $fetch<Activity[]>(`/api/activities?user_id=${userId}&limit=${limit}`)
        return response
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch user activities'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchActivitiesByEntity(entityType: string, entityId: number, limit = 10) {
      this.loading = true
      this.error = null

      try {
        const response = await $fetch<Activity[]>(
          `/api/activities?entity_type=${entityType}&entity_id=${entityId}&limit=${limit}`
        )
        return response
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch entity activities'
        throw error
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    },
  },
})

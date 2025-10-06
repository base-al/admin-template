export const useDashboardState = () => {
  // Reactive state for selected dashboard
  const selectedDashboard = useState<string>('selected_dashboard', () => '')
  
  // Check if user is admin (can switch dashboards)
  const isAdminRole = computed(() => {
    const authStore = useAuthStore()
    const authorizationStore = useAuthorizationStore()
    const roleId = authStore.roleId
    if (!roleId) return false
    
    const role = authorizationStore.getRoleById(roleId)
    const roleName = role?.name || 'Viewer'
    return roleName === 'Super Admin' || roleName === 'Administrator' || roleName === 'Owner'
  })
  
  // Get current user's role name
  const getCurrentRoleName = (): string => {
    const authStore = useAuthStore()
    const authorizationStore = useAuthorizationStore()
    const roleId = authStore.roleId
    if (!roleId) return 'Viewer'
    
    const role = authorizationStore.getRoleById(roleId)
    return role?.name || 'Viewer'
  }
  
  // Initialize dashboard selection
  const initializeDashboard = () => {
    if (process.client) {
      const currentRole = getCurrentRoleName()
      
      if (isAdminRole.value) {
        // For admin users, load from localStorage or default to their role
        const saved = localStorage.getItem('selected_dashboard')
        selectedDashboard.value = saved || currentRole
      } else {
        // For non-admin users, always use their role
        selectedDashboard.value = currentRole
      }
    }
  }
  
  // Set selected dashboard (only for admin users)
  const setSelectedDashboard = (dashboardRole: string) => {
    if (isAdminRole.value && process.client) {
      selectedDashboard.value = dashboardRole
      localStorage.setItem('selected_dashboard', dashboardRole)
    }
  }
  
  // Get dashboard title based on selected dashboard
  const getDashboardTitle = () => {
    const roleNames: Record<string, string> = {
      'Super Admin': 'Super Admin Dashboard',
      'Administrator': 'Administrator Dashboard', 
      'Owner': 'Owner Dashboard',
      'Manager': 'Manager Dashboard',
      'Financial Manager': 'Financial Manager Dashboard',
      'Technical Specialist': 'Technical Specialist Dashboard',
      'Support Agent': 'Support Agent Dashboard',
      'Sales Representative': 'Sales Representative Dashboard',
      'Viewer': 'Viewer Dashboard'
    }
    const dashboardRole = selectedDashboard.value || getCurrentRoleName()
    return roleNames[dashboardRole] || 'Dashboard'
  }
  
  return {
    selectedDashboard: readonly(selectedDashboard),
    isAdminRole,
    getCurrentRoleName,
    initializeDashboard,
    setSelectedDashboard,
    getDashboardTitle
  }
}
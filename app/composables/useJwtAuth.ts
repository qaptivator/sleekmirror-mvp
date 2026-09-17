// JWT-based authentication composable
// Manages access token, refresh token, and user state

const accessToken = useState<string | null>('auth:accessToken', () => null)
const isLoading = useState<boolean>('auth:isLoading', () => false)
const error = useState<string | null>('auth:error', () => null)

// Computed based on access token presence
const isAuthenticated = computed(() => accessToken.value !== null)

export function useJwtAuth() {
  // Get user from the user store
  const userStore = useUserStore()

  async function loginWithDevice(deviceId: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/auth/login-device', {
        method: 'POST',
        body: { deviceId },
      })

      accessToken.value = response.accessToken
      isAuthenticated.value = true
      userStore.setUser(response.user)

      return response
    } catch (err: any) {
      error.value = err?.data?.statusMessage || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function requestOtp(email: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/auth/request-otp', {
        method: 'POST',
        body: { email },
      })

      return response
    } catch (err: any) {
      error.value = err?.data?.statusMessage || 'Failed to request OTP'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function verifyOtp(email: string, code: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/auth/verify-otp', {
        method: 'POST',
        body: { email, code },
      })

      accessToken.value = response.accessToken
      isAuthenticated.value = true
      userStore.setUser(response.user)

      return response
    } catch (err: any) {
      error.value = err?.data?.statusMessage || 'OTP verification failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function refresh() {
    try {
      const response = await $fetch('/api/auth/refresh', {
        method: 'POST',
      })

      accessToken.value = response.accessToken
      return response
    } catch (err: any) {
      // Refresh failed — clear auth state
      accessToken.value = null
      isAuthenticated.value = false
      userStore.clearUser()
      throw err
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      accessToken.value = null
      isAuthenticated.value = false
      userStore.clearUser()
      isLoading.value = false
    }
  }

  function getAuthHeader() {
    return accessToken.value ? `Bearer ${accessToken.value}` : null
  }

  async function tryRestoreAuth() {
    // On app boot, try to refresh the access token using the refresh token cookie
    try {
      const response = await refresh()
      // If successful, user is already set in the store from previous session
      return true
    } catch {
      // Refresh failed, need to log in
      accessToken.value = null
      userStore.clearUser()
      return false
    }
  }

  return {
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    loginWithDevice,
    requestOtp,
    verifyOtp,
    refresh,
    logout,
    tryRestoreAuth,
    getAuthHeader,
  }
}

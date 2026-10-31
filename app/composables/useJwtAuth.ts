// JWT-based authentication composable
// Manages access token, refresh token, and user state

const REFRESH_KEY = 'sleekmirror.refreshToken'

function readRefreshToken() {
  if (!import.meta.client) return null
  return localStorage.getItem(REFRESH_KEY)
}

function writeRefreshToken(token: string | null) {
  if (!import.meta.client) return
  if (token) localStorage.setItem(REFRESH_KEY, token)
  else localStorage.removeItem(REFRESH_KEY)
}

export function useJwtAuth() {
  // Initialize state refs inside the function (required by Nuxt)
  const accessToken = useState<string | null>('auth:accessToken', () => null)
  const isLoading = useState<boolean>('auth:isLoading', () => false)
  const error = useState<string | null>('auth:error', () => null)

  // Computed based on access token presence
  const isAuthenticated = computed(() => accessToken.value !== null)

  // Get user from the user store
  const userStore = useUserStore()

  // Get config for baseURL
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  async function loginWithDevice(deviceId: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/auth/login-device', {
        baseURL,
        method: 'POST',
        body: { deviceId },
        credentials: 'include',
      })

      accessToken.value = response.accessToken
      writeRefreshToken(response.refreshToken)
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
        baseURL,
        method: 'POST',
        body: { email },
        credentials: 'include',
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
        baseURL,
        method: 'POST',
        body: { email, code },
        credentials: 'include',
      })

      accessToken.value = response.accessToken
      writeRefreshToken(response.refreshToken)
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
    const refreshToken = readRefreshToken()
    if (!refreshToken) {
      accessToken.value = null
      userStore.clearUser()
      throw new Error('Refresh token not found')
    }

    try {
      const response = await $fetch('/api/auth/refresh', {
        baseURL,
        method: 'POST',
        credentials: 'include',
        body: { refreshToken },
      })

      accessToken.value = response.accessToken
      if (response.refreshToken) writeRefreshToken(response.refreshToken)
      if (response.user) userStore.setUser(response.user)
      return response
    } catch (err: any) {
      // Refresh failed — clear auth state
      accessToken.value = null
      writeRefreshToken(null)
      userStore.clearUser()
      throw err
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      await $fetch('/api/auth/logout', {
        baseURL,
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      accessToken.value = null
      writeRefreshToken(null)
      userStore.clearUser()
      isLoading.value = false
    }
  }

  function getAuthHeader() {
    return accessToken.value ? `Bearer ${accessToken.value}` : null
  }

  async function tryRestoreAuth() {
    // No saved refresh token means there is no session. Don't call the API.
    if (!readRefreshToken()) {
      accessToken.value = null
      userStore.clearUser()
      return false
    }

    try {
      await refresh()
      return true
    } catch {
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

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
  const offline = useState<boolean>('auth:offline', () => false)
  // True when we must not show the welcome screen because the network failed.
  const offlineHold = useState<boolean>('auth:offlineHold', () => false)

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

  async function refresh(opts?: { signal?: AbortSignal }) {
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
        signal: opts?.signal,
      })

      accessToken.value = response.accessToken
      if (response.refreshToken) writeRefreshToken(response.refreshToken)
      if (response.user) userStore.setUser(response.user)
      offline.value = false
      offlineHold.value = false
      return response
    } catch (err: any) {
      if (isNetworkError(err)) throw err
      // Refresh failed — clear auth state
      accessToken.value = null
      writeRefreshToken(null)
      userStore.clearUser()
      throw err
    }
  }

  function restoreOfflineSession() {
    offline.value = true
    if (!readRefreshToken()) {
      offlineHold.value = false
      return false
    }
    const cached = userStore.loadCachedUser()
    if (cached) {
      userStore.setUser(cached)
      offlineHold.value = false
      return true
    }
    // Keep the refresh token. The welcome screen would look like a logout.
    offlineHold.value = true
    return false
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
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return restoreOfflineSession()
    }

    // No saved refresh token means there is no session. Don't call the API.
    if (!readRefreshToken()) {
      accessToken.value = null
      userStore.clearUser()
      offlineHold.value = false
      return false
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      await refresh({ signal: controller.signal })
      return true
    } catch (err) {
      if (isNetworkError(err)) return restoreOfflineSession()
      accessToken.value = null
      userStore.clearUser()
      offlineHold.value = false
      return false
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    offline,
    offlineHold,
    loginWithDevice,
    requestOtp,
    verifyOtp,
    refresh,
    logout,
    tryRestoreAuth,
    getAuthHeader,
  }
}

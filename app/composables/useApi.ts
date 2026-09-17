import type { NitroFetchRequest, NitroFetchOptions } from 'nitropack'

export const useApi = <
	T = any,
	R extends NitroFetchRequest = NitroFetchRequest
>(
	request: R,
	opts?: NitroFetchOptions<R>
) => {
	const config = useRuntimeConfig()
	const auth = useJwtAuth()

	return $fetch<T, R>(request, {
		baseURL: config.public.apiBase,
		...opts,
		headers: {
			...opts?.headers,
			...(auth.accessToken.value ? { Authorization: `Bearer ${auth.accessToken.value}` } : {}),
		},
		async onResponseError({ response }) {
			// If 401 (unauthorized), try refreshing the token
			if (response.status === 401 && !request.toString().includes('/auth/')) {
				try {
					await auth.refresh()
					// Retry the request with new token
					return $fetch<T, R>(request, {
						baseURL: config.public.apiBase,
						...opts,
						headers: {
							...opts?.headers,
							Authorization: `Bearer ${auth.accessToken.value}`,
						},
					})
				} catch {
					// Refresh failed, user needs to re-login
					await auth.logout()
					throw new Error('Session expired, please log in again')
				}
			}
		},
	})
}

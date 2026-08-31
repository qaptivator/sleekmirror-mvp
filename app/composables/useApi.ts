import type { NitroFetchRequest, NitroFetchOptions } from 'nitropack'

export const useApi = <
	T = any,
	R extends NitroFetchRequest = NitroFetchRequest
>(
	request: R,
	opts?: NitroFetchOptions<R>
) => {
	const config = useRuntimeConfig()
	const token = useState<string | null>('authToken')
	console.log('useApi token:', token)

	return $fetch<T, R>(request, {
		baseURL: config.public.apiBase,
		...opts,
		headers: {
			...opts?.headers,
			...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
		},
	})
}

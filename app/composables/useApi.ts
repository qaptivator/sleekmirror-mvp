export const useApi: typeof $fetch = (request, opts?) => {
	const config = useRuntimeConfig()
	return $fetch(request, {
		baseURL: config.public.apiBase,
		...opts,
	})
}

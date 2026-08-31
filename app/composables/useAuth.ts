import { Capacitor } from '@capacitor/core'
import { Device } from '@capacitor/device'

export const useAuth = () => {
	const config = useRuntimeConfig()
	const user = useState<any>('authUser', () => null)
	const token = useState<string | null>('authToken', () => null)

	const getDeviceId = async (): Promise<string> => {
		// ran only in development, i hope...
		if (import.meta.dev && !Capacitor.isNativePlatform()) {
			return '6a4bb0da27b09ebd780971a8' // our original id!
		}

		const info = await Device.getId()
		return info.identifier
	}

	const initAuth = async () => {
		const identifier = await getDeviceId()
		console.log('initAuth identifier:', identifier)

		const res = await $fetch<{ token: string; user: any }>(
			'/api/auth/device-login',
			{
				method: 'POST',
				baseURL: config.public.apiBase,
				body: { deviceId: identifier },
			}
		)
		console.log('initAuth res:', res)

		token.value = res.token
		user.value = res.user
	}

	// Helper for authenticated requests
	/*const apiFetch = (url: string, opts: any = {}) => {
		return $fetch(`${config.public.apiBase}${url}`, {
			...opts,
			headers: {
				...opts.headers,
				Authorization: token.value ? `Bearer ${token.value}` : '',
			},
		})
	}*/

	return { user, token, initAuth }
}

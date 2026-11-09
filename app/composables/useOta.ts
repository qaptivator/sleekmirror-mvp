import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

const OTA_ORIGIN = 'https://sleekmirror-capgo.acdev.app'

export type OtaBusy = 'idle' | 'checking' | 'downloading'

const isNative = ref(false)
const currentVersion = ref('')
const currentSource = ref('')
const nativeVersion = ref('')
const latestVersion = ref('')
const pendingVersion = ref('')
const busy = ref<OtaBusy>('idle')
const applying = ref(false)
const lastError = ref('')
const checkedAt = ref<number | null>(null)

let booted = false
let resumeHooked = false
let inFlight: Promise<void> | null = null

function errorText(error: unknown) {
	if (error instanceof Error && error.message) return error.message
	if (typeof error === 'string' && error) return error
	if (error && typeof error === 'object' && 'message' in error) {
		const message = (error as { message?: unknown }).message
		if (typeof message === 'string' && message) return message
	}
	return 'Update check failed'
}

async function refreshLocal() {
	if (!Capacitor.isNativePlatform()) {
		isNative.value = false
		currentVersion.value = 'browser'
		currentSource.value = 'This browser session'
		nativeVersion.value = ''
		pendingVersion.value = ''
		return
	}

	isNative.value = true
	const { bundle, native } = await CapacitorUpdater.current()
	currentVersion.value = bundle.version || 'unknown'
	currentSource.value = bundle.id === 'builtin' ? 'Built-in' : 'Live bundle'
	nativeVersion.value = native || ''

	const next = await CapacitorUpdater.getNextBundle()
	pendingVersion.value =
		next?.version && next.version !== bundle.version ? next.version : ''
}

async function runCheck() {
	busy.value = 'checking'
	try {
		if (Capacitor.isNativePlatform()) await refreshLocal()

		const res = await CapacitorHttp.get({
			url: `${OTA_ORIGIN}/version.json?t=${Date.now()}`,
		})
		const remote =
			typeof res.data === 'string' ? JSON.parse(res.data) : res.data

		if (!remote?.version || !remote?.url || !remote?.checksum) {
			throw new Error('Update metadata is missing version, url, or checksum')
		}

		latestVersion.value = String(remote.version)
		checkedAt.value = Date.now()
		lastError.value = ''

		if (!Capacitor.isNativePlatform()) return
		if (
			latestVersion.value === currentVersion.value ||
			latestVersion.value === pendingVersion.value
		) {
			return
		}

		busy.value = 'downloading'
		const downloaded = await CapacitorUpdater.download({
			url: remote.url,
			version: remote.version,
			checksum: remote.checksum,
		})
		await CapacitorUpdater.next({ id: downloaded.id })
		await refreshLocal()
	} catch (error) {
		lastError.value = errorText(error)
		checkedAt.value = Date.now()
	} finally {
		busy.value = 'idle'
	}
}

export function useOta() {
	const updateReady = computed(
		() => isNative.value && pendingVersion.value !== '' && busy.value !== 'downloading'
	)
	const upToDate = computed(
		() =>
			latestVersion.value !== '' &&
			currentVersion.value !== '' &&
			latestVersion.value === currentVersion.value &&
			!updateReady.value
	)

	async function boot() {
		if (booted) return
		booted = true

		if (Capacitor.isNativePlatform()) {
			try {
				await CapacitorUpdater.notifyAppReady()
			} catch (error) {
				lastError.value = errorText(error)
			}
		}

		try {
			await refreshLocal()
		} catch (error) {
			lastError.value = errorText(error)
		}

		if (isNative.value && !resumeHooked) {
			try {
				const { App } = await import('@capacitor/app')
				await App.addListener('appStateChange', ({ isActive }) => {
					if (isActive) void check()
				})
				resumeHooked = true
			} catch {
				// Resume checks are a convenience; manual check still works.
			}
		}

		void check()
	}

	function check(options?: { force?: boolean }) {
		if (inFlight) return inFlight
		if (
			!options?.force &&
			checkedAt.value &&
			Date.now() - checkedAt.value < 30_000 &&
			!lastError.value
		) {
			return Promise.resolve()
		}
		inFlight = runCheck().finally(() => {
			inFlight = null
		})
		return inFlight
	}

	async function restart() {
		if (!isNative.value || applying.value) return
		applying.value = true
		try {
			await CapacitorUpdater.reload()
		} catch (error) {
			applying.value = false
			lastError.value = errorText(error)
		}
	}

	return {
		isNative,
		currentVersion,
		currentSource,
		nativeVersion,
		latestVersion,
		pendingVersion,
		busy,
		applying,
		lastError,
		checkedAt,
		updateReady,
		upToDate,
		boot,
		check,
		restart,
		refreshLocal,
	}
}

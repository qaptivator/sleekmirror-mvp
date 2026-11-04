<template>
	<div class="w-full h-full">
		<!-- Loading splash screen -->
		<div
			v-if="isChecking"
			class="w-full h-full flex items-center justify-center bg-obsidian"
		>
			<img
				src="@/assets/images/icon-splash.png"
				alt="Sleekmirror"
				class="w-32 h-32"
			/>
		</div>

		<!-- Offline with no session yet: don't present the login menu -->
		<div
			v-else-if="offlineHold && !hasSession"
			class="w-full h-full flex flex-col items-center justify-center bg-obsidian text-cream px-8 text-center"
		>
			<p class="text-[11px] font-mono uppercase tracking-[0.3em] text-gold">
				Sleekmirror
			</p>
			<h1 class="text-2xl font-semibold mt-4">You're offline</h1>
			<p class="text-sm text-cream/60 mt-2 max-w-xs leading-relaxed">
				Connect to the internet to open your account. Nothing was signed out.
			</p>
		</div>

		<!-- Not authenticated: show welcome screen -->
		<WelcomeScreen
			v-else-if="!hasSession"
			@authenticated="onAuthenticatedSuccess"
		/>

		<!-- Authenticated: show main app -->
		<div
			v-else
			class="w-full h-full flex flex-col"
		>
			<div
				v-if="offline"
				class="shrink-0 bg-ink border-b border-gold/20 px-4 pt-[max(0.55rem,env(safe-area-inset-top))] pb-2 text-center"
			>
				<p class="text-[11px] text-gold">
					You're offline. Reconnect before taking a check.
				</p>
			</div>
			<div class="flex-1 min-h-0">
				<NuxtPage />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

const OTA_VERSION_URL = 'https://sleekmirror-capgo.acdev.app'

const auth = useJwtAuth()
const userStore = useUserStore()

const offline = auth.offline
const offlineHold = auth.offlineHold
const hasSession = computed(
	() => auth.isAuthenticated.value || userStore.currentUser !== null
)
const isChecking = ref(true)
let removeBackListener: (() => void) | null = null

onMounted(async () => {
	// Must be called on boot so Capgo knows the bundle is stable
	await CapacitorUpdater.notifyAppReady()

	window.addEventListener('offline', onOffline)
	window.addEventListener('online', onOnline)

	// Try to restore authentication from previous session (refresh token)
	await auth.tryRestoreAuth()
	isChecking.value = false

	if (Capacitor.isNativePlatform()) {
		try {
			const { App } = await import('@capacitor/app')
			const handle = await App.addListener('backButton', () => {
				if (!consumeBack()) App.exitApp()
			})
			removeBackListener = () => {
				void handle.remove()
			}
		} catch (e) {
			console.warn('Back button handler unavailable', e)
		}
	}

	// Fire and forget, never block the UI on an update check
	checkForOtaUpdate()
})

onUnmounted(() => {
	window.removeEventListener('offline', onOffline)
	window.removeEventListener('online', onOnline)
	removeBackListener?.()
})

function onOffline() {
	offline.value = true
}

async function onOnline() {
	if (!navigator.onLine) return
	offline.value = false
	if (auth.isAuthenticated.value) {
		offlineHold.value = false
		return
	}
	await auth.tryRestoreAuth()
}

async function checkForOtaUpdate() {
	if (!Capacitor.isNativePlatform()) return

	try {
		// CapacitorHttp goes through native code, so no CORS setup is needed on the bucket
		const res = await CapacitorHttp.get({
			url: `${OTA_VERSION_URL}/version.json?t=${Date.now()}`,
		})

		const remote =
			typeof res.data === 'string' ? JSON.parse(res.data) : res.data

		if (!remote?.version || !remote?.url || !remote?.checksum) {
			console.warn('OTA metadata is missing version, url, or checksum')
			return
		}

		const { bundle } = await CapacitorUpdater.current()
		if (bundle.version === remote.version) return

		const downloaded = await CapacitorUpdater.download({
			url: remote.url,
			version: remote.version,
			checksum: remote.checksum,
		})

		// Applies on the next app launch, so it won't reload the app mid-session.
		// Use CapacitorUpdater.set({ id: downloaded.id }) to apply immediately instead.
		await CapacitorUpdater.next({ id: downloaded.id })
	} catch (e) {
		console.warn('OTA update check failed', e)
	}
}

async function onAuthenticatedSuccess() {
	// When user successfully logs in, the page will re-render
	// showing the main app
}
</script>

<style>
body {
	margin: 0;
	padding: 0;
}

#__nuxt {
	width: 100%;
	height: 100%;
}
</style>

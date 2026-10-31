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

		<!-- Not authenticated: show welcome screen -->
		<WelcomeScreen
			v-else-if="!isAuthenticated"
			@authenticated="onAuthenticatedSuccess"
		/>

		<!-- Authenticated: show main app -->
		<NuxtPage v-else />
	</div>
</template>

<script setup lang="ts">
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

const OTA_VERSION_URL =
	'https://239a994e8435c57654cc7796bfd866a4.r2.cloudflarestorage.com/sleekmirror-capgo'

const auth = useJwtAuth()

const isAuthenticated = computed(() => auth.isAuthenticated.value)
const isChecking = ref(true)

onMounted(async () => {
	// Must be called on boot so Capgo knows the bundle is stable
	await CapacitorUpdater.notifyAppReady()

	// Try to restore authentication from previous session (refresh token)
	await auth.tryRestoreAuth()
	isChecking.value = false

	// Fire and forget, never block the UI on an update check
	checkForOtaUpdate()
})

async function checkForOtaUpdate() {
	if (!Capacitor.isNativePlatform()) return

	try {
		// CapacitorHttp goes through native code, so no CORS setup is needed on the bucket
		const res = await CapacitorHttp.get({
			url: `${OTA_VERSION_URL}/version.json?t=${Date.now()}`,
		})
		const remote =
			typeof res.data === 'string' ? JSON.parse(res.data) : res.data
		if (!remote?.version || !remote?.url) return

		const { bundle } = await CapacitorUpdater.current()
		if (bundle.version === remote.version) return

		const downloaded = await CapacitorUpdater.download({
			url: remote.url,
			version: remote.version,
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

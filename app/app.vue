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

		<ConsentScreen
			v-else-if="needsConsent && !userStore.consentPromptDismissed"
			@declined="userStore.dismissConsentPrompt()"
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
import { Capacitor } from '@capacitor/core'

const auth = useJwtAuth()
const userStore = useUserStore()
const ota = useOta()

const offline = auth.offline
const offlineHold = auth.offlineHold
const hasSession = computed(
	() => auth.isAuthenticated.value || userStore.currentUser !== null
)
const needsConsent = computed(
	() => hasSession.value && !userStore.hasAiPhotoConsent
)
const isChecking = ref(true)
let removeBackListener: (() => void) | null = null

onMounted(async () => {
	window.addEventListener('offline', onOffline)
	window.addEventListener('online', onOnline)

	try {
		// notifyAppReady has to run before the bundle is treated as stable.
		// A failed update check must not trap the splash screen.
		await ota.boot()
		await auth.tryRestoreAuth()
	} finally {
		isChecking.value = false
	}

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
	void ota.check({ force: true })
	if (auth.isAuthenticated.value) {
		offlineHold.value = false
		return
	}
	await auth.tryRestoreAuth()
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

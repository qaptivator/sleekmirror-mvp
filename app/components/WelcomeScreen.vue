<template>
	<div class="w-full h-full flex flex-col bg-obsidian text-cream font-sans overflow-hidden">

		<!-- Safe area top -->
		<div class="flex-1" />

		<!-- Content -->
		<div class="px-6 pb-12 space-y-8 text-center">

			<!-- Logo / Title -->
			<div class="space-y-2">
				<p class="text-[11px] font-mono uppercase tracking-[0.3em] text-gold">
					Sleekmirror
				</p>
				<h1 class="text-3xl font-semibold text-cream leading-tight">
					Welcome
				</h1>
				<p class="text-sm text-cream/60 leading-relaxed">
					AI-powered outfit &amp; look analysis
				</p>
			</div>

			<!-- Features teaser -->
			<div class="space-y-3 text-left">
				<div class="flex items-start gap-3">
					<div class="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
						<IconCamera class="w-3 h-3 text-gold" />
					</div>
					<div>
						<p class="text-xs font-semibold text-cream">Snap &amp; Analyze</p>
						<p class="text-[11px] text-cream/50">Get instant AI feedback on your look</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
						<IconShirt class="w-3 h-3 text-gold" />
					</div>
					<div>
						<p class="text-xs font-semibold text-cream">Track Progress</p>
						<p class="text-[11px] text-cream/50">Keep history of your style checks</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
						<IconLink class="w-3 h-3 text-gold" />
					</div>
					<div>
						<p class="text-xs font-semibold text-cream">Secure Account</p>
						<p class="text-[11px] text-cream/50">Link email to protect your data</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Flex spacer -->
		<div class="flex-1" />

		<!-- Buttons -->
		<div class="px-6 pb-safe-bottom space-y-3">

			<!-- Continue with Device -->
			<button
				@click="handleDeviceLogin"
				:disabled="isLoading"
				class="w-full py-4 px-4 rounded-xl bg-gold text-obsidian font-semibold text-sm transition-all active:scale-[0.98] hover:bg-gold-soft disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				<IconSmartphone v-if="!isLoading" class="w-5 h-5" />
				<span v-if="isLoading" class="inline-block w-4 h-4 rounded-full border-2 border-obsidian/30 border-t-obsidian animate-spin" />
				{{ isLoading ? 'Signing in...' : 'Continue with Device' }}
			</button>

			<!-- Login with Email -->
			<button
				@click="showEmailFlow = true"
				:disabled="isLoading"
				class="w-full py-4 px-4 rounded-xl border border-cream/20 text-cream font-semibold text-sm transition-all active:scale-[0.98] hover:bg-cream/5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				<IconMail v-if="!isLoading" class="w-5 h-5" />
				<span v-if="isLoading" class="inline-block w-4 h-4 rounded-full border-2 border-cream/30 border-t-cream animate-spin" />
				Login with Email
			</button>

			<!-- Error message -->
			<Transition name="fade">
				<div
					v-if="errorMessage"
					class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 text-center"
				>
					{{ errorMessage }}
				</div>
			</Transition>
		</div>

		<!-- Email login sheet (teleported) -->
		<EmailLoginSheet v-model="showEmailFlow" />
	</div>
</template>

<script setup lang="ts">
import { Device } from '@capacitor/device'

const auth = useJwtAuth()
const isLoading = ref(false)
const errorMessage = ref('')
const showEmailFlow = ref(false)

const emit = defineEmits<{
	authenticated: []
}>()

async function handleDeviceLogin() {
	isLoading.value = true
	errorMessage.value = ''

	try {
		const info = await Device.getId()
		console.log('handleDeviceLogin Device.getId', info)
		await auth.loginWithDevice(info.identifier)
		console.log('auth.loginWithDevice done')
		emit('authenticated')
	} catch (err: any) {
		errorMessage.value = err?.message || 'Device login failed'
		console.error(err)
	} finally {
		isLoading.value = false
	}
}
</script>

<style scoped>
.pb-safe-bottom { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

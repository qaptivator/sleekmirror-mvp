<template>
	<Teleport to="body">
		<Transition name="sheet-up">
			<div
				v-if="modelValue"
				class="fixed inset-0 z-50 flex flex-col bg-obsidian text-cream font-sans"
			>
				<!-- Header -->
				<div class="flex items-center justify-between px-6 pt-safe-top pb-4 border-b border-cream/5 shrink-0">
					<div>
						<p class="text-[10px] uppercase tracking-widest text-muted font-bold">Account</p>
						<h2 class="text-lg font-semibold text-cream mt-0.5">Profile & Settings</h2>
					</div>
					<button
						@click="closeDrawer"
						class="w-9 h-9 rounded-full flex items-center justify-center bg-cream/5 hover:bg-cream/10 transition-colors active:scale-95"
					>
						<IconX class="w-5 h-5 text-cream/70" />
					</button>
				</div>

				<div class="flex-1 overflow-y-auto px-6 py-5 space-y-4 hide-scrollbar">

					<!-- Account Card -->
					<div class="bg-ink border border-cream/10 rounded-2xl p-4 space-y-3">
						<div class="flex items-center gap-3">
							<div class="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
								<IconCircleUser class="w-7 h-7 text-gold" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold text-cream">Guest Account</p>
								<p class="text-[10px] text-muted">This device</p>
							</div>
						</div>

						<div class="border-t border-cream/5 pt-3 flex items-center gap-3">
							<div class="min-w-0 flex-1">
								<p class="text-xs text-cream">Support ID</p>
								<p class="text-[10px] font-mono text-muted truncate mt-0.5">
									{{ supportId || 'Identifying device...' }}
								</p>
							</div>
							<button
								type="button"
								@click="copySupportId"
								:disabled="!supportId"
								class="shrink-0 px-3 py-1.5 rounded-lg bg-cream/5 border border-cream/10 text-[11px] font-semibold text-cream hover:bg-cream/10 transition-colors active:scale-95 disabled:opacity-40"
							>
								Copy
							</button>
						</div>

						<!-- Credits row -->
						<div class="border-t border-cream/5 pt-3 flex items-center justify-between">
							<div>
								<p class="text-xs text-muted">Remaining Scans</p>
								<p class="text-[10px] text-muted/50 mt-0.5">1 scan per check</p>
							</div>
							<div class="text-right">
								<p class="text-xl font-bold text-gold font-mono tabular-nums">{{ userStore.credits }}</p>
								<p class="text-[10px] text-muted">scans left</p>
							</div>
						</div>
					</div>

					<!-- Email linking is hidden until mail sending exists.
					<div class="bg-gold/5 border border-gold/15 rounded-2xl p-4">
						<button @click="showLinkEmail = true">Link Email Now</button>
					</div>
					-->

					<!-- Preferences -->
					<div class="bg-ink border border-cream/10 rounded-2xl overflow-hidden divide-y divide-cream/5">
						<p class="text-[10px] uppercase tracking-widest text-muted font-bold px-4 pt-4 pb-2">Preferences</p>

						<!-- Haptics toggle (placeholder — no-op until Capacitor Haptics is wired) -->
						<div class="flex items-center justify-between px-4 py-3.5">
							<div>
								<p class="text-xs text-cream">Haptic Feedback</p>
								<p class="text-[10px] text-muted/60 mt-0.5">Vibrate on snap &amp; results</p>
							</div>
							<button
								type="button"
								role="switch"
								:aria-checked="hapticsEnabled"
								@click="hapticsEnabled = !hapticsEnabled"
								class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
								:class="hapticsEnabled ? 'bg-gold' : 'bg-cream/15'"
							>
								<span
									class="pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
									:class="hapticsEnabled ? 'translate-x-5' : 'translate-x-0'"
								/>
							</button>
						</div>

						<!-- Default mode -->
						<div class="flex items-center justify-between px-4 py-3.5">
							<div>
								<p class="text-xs text-cream">Default Style Mode</p>
								<p class="text-[10px] text-muted/60 mt-0.5">Pre-select on camera open</p>
							</div>
							<select
								v-model="defaultMode"
								class="text-[11px] font-mono text-cream bg-cream/5 border border-cream/10 rounded-lg px-2 py-1 appearance-none cursor-pointer"
							>
								<option value="casual">Casual</option>
								<option value="interview">Interview</option>
								<option value="date night">Date Night</option>
								<option value="formal">Formal</option>
								<option value="cocktail">Cocktail</option>
							</select>
						</div>
					</div>

					<!-- Privacy -->
					<div class="bg-ink border border-cream/10 rounded-2xl overflow-hidden divide-y divide-cream/5">
						<p class="text-[10px] uppercase tracking-widest text-muted font-bold px-4 pt-4 pb-2">Privacy</p>
						<div class="px-4 py-3.5 space-y-1.5">
							<p class="text-xs text-cream">Photo processing</p>
							<p class="text-[10px] text-muted/70 leading-relaxed">
								{{
									userStore.hasAiPhotoConsent
										? 'You consented to sending photos to OpenAI for analysis. Withdraw below to stop new checks.'
										: 'Required before a check can run. Photos go to OpenAI for analysis and are not stored by us.'
								}}
							</p>
							<button
								v-if="userStore.hasAiPhotoConsent"
								type="button"
								:disabled="isWithdrawing"
								@click="withdrawConsent"
								class="mt-2 text-[11px] font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
							>
								{{ withdrawLabel }}
							</button>
						</div>
						<a
							href="https://sleekmirror.com/privacy"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center justify-between px-4 py-3"
						>
							<span class="text-xs text-cream">Privacy Policy</span>
							<span class="text-[10px] text-muted">Open</span>
						</a>
						<a
							href="https://sleekmirror.com/terms"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center justify-between px-4 py-3"
						>
							<span class="text-xs text-cream">Terms of Service</span>
							<span class="text-[10px] text-muted">Open</span>
						</a>
					</div>

					<!-- App Info -->
					<div class="bg-ink border border-cream/10 rounded-2xl overflow-hidden divide-y divide-cream/5">
						<p class="text-[10px] uppercase tracking-widest text-muted font-bold px-4 pt-4 pb-2">App Info</p>
						<div class="flex items-center justify-between px-4 py-3">
							<span class="text-xs text-muted">Version</span>
							<span class="text-xs font-mono text-cream/60">v1.0.0</span>
						</div>
					</div>

					<!-- Logout Button -->
					<div class="border-t border-cream/10 pt-4">
						<button
							@click="handleLogout"
							:disabled="isLoggingOut"
							class="w-full py-3 px-4 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all active:scale-[0.98] disabled:opacity-50 text-xs font-semibold"
						>
							{{ isLoggingOut ? 'Logging out...' : 'Log Out' }}
						</button>
					</div>

					<div class="h-2" />
				</div>

				<!-- Clipboard toast -->
				<Transition name="toast-fade">
					<div
						v-if="showCopyToast"
						class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink border border-cream/20 rounded-xl px-4 py-2.5 text-xs text-cream shadow-xl z-50 whitespace-nowrap"
					>
						Support ID copied
					</div>
				</Transition>
			</div>
		</Transition>
	</Teleport>

	<!-- Email linking stays hidden until mail sending exists.
	<EmailLinkingSheet v-model="showLinkEmail" />
	-->
</template>

<script setup lang="ts">
import { Device } from '@capacitor/device'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const userStore = useUserStore()
const auth = useJwtAuth()
const supportId = ref<string>('')
const showCopyToast = ref(false)
const hapticsEnabled = ref(true)
const defaultMode = ref('casual')
const isLoggingOut = ref(false)
const isWithdrawing = ref(false)
const withdrawArmed = ref(false)

const withdrawLabel = computed(() => {
	if (isWithdrawing.value) return 'Withdrawing...'
	if (withdrawArmed.value) return 'Tap again to confirm'
	return 'Withdraw consent'
})

function closeDrawer() {
	withdrawArmed.value = false
	emit('update:modelValue', false)
}

useBackHandler(() => props.modelValue, closeDrawer)

onMounted(async () => {
	try {
		const info = await Device.getId()
		supportId.value = `device:${info.identifier}`
	} catch {
		supportId.value = ''
	}

	// Restore preferences from localStorage
	const saved = localStorage.getItem('sm:prefs')
	if (saved) {
		try {
			const p = JSON.parse(saved)
			hapticsEnabled.value = p.haptics ?? true
			defaultMode.value = p.defaultMode ?? 'casual'
		} catch { /* ignore */ }
	}
})

// Persist preferences when they change
watch([hapticsEnabled, defaultMode], () => {
	localStorage.setItem('sm:prefs', JSON.stringify({
		haptics: hapticsEnabled.value,
		defaultMode: defaultMode.value,
	}))
})

async function copySupportId() {
	if (!supportId.value) return
	try {
		await navigator.clipboard.writeText(supportId.value)
	} catch {
		const field = document.createElement('textarea')
		field.value = supportId.value
		field.setAttribute('readonly', '')
		field.style.position = 'fixed'
		field.style.left = '-9999px'
		document.body.appendChild(field)
		field.select()
		document.execCommand('copy')
		document.body.removeChild(field)
	}
	showCopyToast.value = true
	setTimeout(() => (showCopyToast.value = false), 2000)
}

async function withdrawConsent() {
	if (!withdrawArmed.value) {
		withdrawArmed.value = true
		return
	}
	isWithdrawing.value = true
	try {
		const response = await useApi<{ user: typeof userStore.currentUser }>(
			'/api/users/consent',
			{ method: 'POST', body: { granted: false } }
		)
		if (response.user) userStore.setUser(response.user)
		userStore.dismissConsentPrompt()
		closeDrawer()
	} finally {
		isWithdrawing.value = false
		withdrawArmed.value = false
	}
}

async function handleLogout() {
	isLoggingOut.value = true
	try {
		await auth.logout()
	} finally {
		isLoggingOut.value = false
	}
}
</script>

<style scoped>
.pt-safe-top { padding-top: max(1.5rem, env(safe-area-inset-top)); }

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.sheet-up-enter-active,
.sheet-up-leave-active {
	transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.sheet-up-enter-from,
.sheet-up-leave-to {
	transform: translateY(100%);
	opacity: 0;
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(6px); }
</style>

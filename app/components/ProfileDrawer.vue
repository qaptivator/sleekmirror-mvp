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
						@click="$emit('update:modelValue', false)"
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
								<button
									@click="copyDeviceId"
									class="text-[10px] text-muted truncate text-left hover:text-cream/60 transition-colors active:scale-95 max-w-full"
									:title="deviceIdentifier"
								>
									{{ deviceIdentifier || 'Identifying device...' }}
								</button>
							</div>
						</div>

						<!-- Credits row -->
						<div class="border-t border-cream/5 pt-3 flex items-center justify-between">
							<div>
								<p class="text-xs text-muted">Remaining Scans</p>
								<p class="text-[10px] text-muted/50 mt-0.5">1 credit per check</p>
							</div>
							<div class="text-right">
								<p class="text-xl font-bold text-gold font-mono tabular-nums">{{ userStore.credits }}</p>
								<p class="text-[10px] text-muted">credits</p>
							</div>
						</div>
					</div>

					<!-- Link Account Button (if not already linked) -->
					<div
						v-if="!userStore.currentUser?.emailVerified"
						class="bg-gold/5 border border-gold/15 rounded-2xl p-4 space-y-3"
					>
						<p class="text-xs font-semibold text-gold flex items-center gap-1.5">
							<IconCircleAlert class="w-4 h-4" />
							Secure Your Account
						</p>
						<p class="text-[11px] text-cream/50 leading-relaxed">
							Link an email to protect your account. Otherwise, switching devices will lose your progress.
						</p>
						<button
							@click="showLinkEmail = true"
							class="w-full py-2 px-3 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition-colors text-xs font-semibold"
						>
							Link Email Now
						</button>
					</div>

					<!-- Already linked -->
					<div v-else class="bg-gold/5 border border-gold/15 rounded-2xl p-4 space-y-2">
						<p class="text-xs font-semibold text-gold flex items-center gap-1.5">
							<IconCircleCheck class="w-4 h-4" />
							Account Secured
						</p>
						<p class="text-[11px] text-cream/50">
							Email: <span class="text-cream font-mono">{{ userStore.currentUser?.email }}</span>
						</p>
					</div>

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
								@click="hapticsEnabled = !hapticsEnabled"
								class="relative w-10 h-5.5 rounded-full transition-colors duration-200"
								:class="hapticsEnabled ? 'bg-gold' : 'bg-cream/10'"
							>
								<span
									class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
									:class="hapticsEnabled ? 'translate-x-5' : 'translate-x-0.5'"
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

					<!-- App Info -->
					<div class="bg-ink border border-cream/10 rounded-2xl overflow-hidden divide-y divide-cream/5">
						<p class="text-[10px] uppercase tracking-widest text-muted font-bold px-4 pt-4 pb-2">App Info</p>
						<div class="flex items-center justify-between px-4 py-3">
							<span class="text-xs text-muted">Version</span>
							<span class="text-xs font-mono text-cream/60">v1.0.0</span>
						</div>
						<div class="flex items-center justify-between px-4 py-3">
							<span class="text-xs text-muted">Storage</span>
							<span class="text-xs font-mono text-cream/60">Cloudflare R2</span>
						</div>
						<div class="flex items-center justify-between px-4 py-3">
							<span class="text-xs text-muted">AI Engine</span>
							<span class="text-xs font-mono text-cream/60">GPT-4o Vision</span>
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
						Device ID copied
					</div>
				</Transition>
			</div>
		</Transition>
	</Teleport>

	<!-- Email linking modal -->
	<EmailLinkingSheet v-model="showLinkEmail" />
</template>

<script setup lang="ts">
import { Device } from '@capacitor/device'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()

const userStore = useUserStore()
const auth = useJwtAuth()
const deviceIdentifier = ref<string>('')
const showCopyToast = ref(false)
const showLinkEmail = ref(false)
const hapticsEnabled = ref(true)
const defaultMode = ref('casual')
const isLoggingOut = ref(false)

onMounted(async () => {
	try {
		const info = await Device.getId()
		deviceIdentifier.value = `device:${info.identifier}`
	} catch {
		deviceIdentifier.value = 'Unknown Device'
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

async function copyDeviceId() {
	if (!deviceIdentifier.value) return
	try {
		await navigator.clipboard.writeText(deviceIdentifier.value)
	} catch {
		// ignore
	}
	showCopyToast.value = true
	setTimeout(() => (showCopyToast.value = false), 2000)
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

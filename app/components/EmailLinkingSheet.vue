<template>
	<Teleport to="body">
		<Transition name="sheet-up">
			<div
				v-if="modelValue"
				class="fixed inset-0 z-50 flex flex-col bg-obsidian text-cream font-sans"
			>
				<!-- Header -->
				<div class="flex items-center justify-between px-6 pt-safe-top pb-4 border-b border-cream/5 shrink-0">
					<h2 class="text-lg font-semibold text-cream">Link Email</h2>
					<button
						@click="$emit('update:modelValue', false)"
						class="w-9 h-9 rounded-full flex items-center justify-center bg-cream/5 hover:bg-cream/10 transition-colors active:scale-95"
					>
						<IconX class="w-5 h-5 text-cream/70" />
					</button>
				</div>

				<div class="flex-1 overflow-y-auto px-6 py-6 space-y-6 hide-scrollbar">

					<!-- Step 1: Email Input -->
					<div v-if="step === 'email'" class="space-y-4">
						<div>
							<label class="text-xs uppercase tracking-widest text-muted font-bold block mb-2">
								Email Address
							</label>
							<input
								v-model="email"
								type="email"
								placeholder="you@example.com"
								class="w-full px-4 py-3 bg-ink border border-cream/10 rounded-lg text-cream placeholder:text-muted/60 focus:outline-none focus:border-gold transition-colors"
								@keyup.enter="requestOtp"
							/>
						</div>

						<button
							@click="requestOtp"
							:disabled="!email || !isValidEmail(email) || isLoading"
							class="w-full py-3 px-4 rounded-lg bg-gold text-obsidian font-semibold text-sm transition-all active:scale-[0.98] hover:bg-gold-soft disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{{ isLoading ? 'Sending...' : 'Send Verification Code' }}
						</button>
					</div>

					<!-- Step 2: OTP Verification -->
					<div v-if="step === 'otp'" class="space-y-4">
						<div>
							<p class="text-xs text-cream/70 mb-4">
								Enter the code sent to
								<span class="font-semibold text-cream">{{ email }}</span>
							</p>

							<label class="text-xs uppercase tracking-widest text-muted font-bold block mb-2">
								Verification Code
							</label>
							<input
								v-model="otpCode"
								type="text"
								inputmode="numeric"
								maxlength="6"
								placeholder="000000"
								class="w-full px-4 py-3 bg-ink border border-cream/10 rounded-lg text-cream text-center text-xl font-mono tracking-widest placeholder:text-muted/60 focus:outline-none focus:border-gold transition-colors"
								@keyup.enter="verifyOtp"
							/>
						</div>

						<div class="flex items-center justify-between text-xs text-muted/60">
							<span>Code expires in {{ otpTimeLeft }}s</span>
							<button
								v-if="otpTimeLeft === 0"
								@click="step = 'email'"
								class="text-gold hover:text-gold-soft transition-colors"
							>
								Resend Code
							</button>
						</div>

						<button
							@click="verifyOtp"
							:disabled="otpCode.length !== 6 || isLoading"
							class="w-full py-3 px-4 rounded-lg bg-gold text-obsidian font-semibold text-sm transition-all active:scale-[0.98] hover:bg-gold-soft disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{{ isLoading ? 'Verifying...' : 'Verify Code' }}
						</button>

						<button
							@click="step = 'email'"
							class="w-full py-3 px-4 rounded-lg border border-cream/10 text-cream text-sm transition-all active:scale-[0.98] hover:bg-cream/5"
						>
							Change Email
						</button>
					</div>

					<!-- Success -->
					<div v-if="step === 'success'" class="flex flex-col items-center justify-center py-8 space-y-4 text-center">
						<div class="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
							<IconCircleCheck class="w-8 h-8 text-gold" />
						</div>
						<div>
							<p class="text-lg font-semibold text-cream">Email Linked!</p>
							<p class="text-xs text-cream/60 mt-1">Your account is now secured</p>
						</div>
					</div>

					<!-- Error -->
					<Transition name="fade">
						<div
							v-if="errorMessage"
							class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400"
						>
							{{ errorMessage }}
						</div>
					</Transition>
				</div>

				<!-- Footer button (only on success) -->
				<div v-if="step === 'success'" class="px-6 pb-safe-bottom py-4 border-t border-cream/5">
					<button
						@click="$emit('update:modelValue', false)"
						class="w-full py-3 px-4 rounded-lg bg-gold text-obsidian font-semibold text-sm transition-all active:scale-[0.98] hover:bg-gold-soft"
					>
						Done
					</button>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const auth = useJwtAuth()
const userStore = useUserStore()

const step = ref<'email' | 'otp' | 'success'>('email')
const email = ref('')
const otpCode = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const otpTimeLeft = ref(600)
let otpTimer: ReturnType<typeof setInterval> | null = null

function isValidEmail(str: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)
}

async function requestOtp() {
	if (!isValidEmail(email.value)) return

	isLoading.value = true
	errorMessage.value = ''
	otpCode.value = ''

	try {
		await auth.requestOtp(email.value)
		step.value = 'otp'
		otpTimeLeft.value = 600

		if (otpTimer) clearInterval(otpTimer)
		otpTimer = setInterval(() => {
			otpTimeLeft.value--
			if (otpTimeLeft.value === 0) {
				clearInterval(otpTimer!)
				otpTimer = null
			}
		}, 1000)
	} catch (err: any) {
		errorMessage.value = err?.message || 'Failed to send code'
	} finally {
		isLoading.value = false
	}
}

async function verifyOtp() {
	if (otpCode.value.length !== 6) return

	isLoading.value = true
	errorMessage.value = ''

	try {
		await auth.verifyOtp(email.value, otpCode.value)
		if (otpTimer) clearInterval(otpTimer)
		step.value = 'success'
		// Update user store
		userStore.currentUser!.email = email.value
		userStore.currentUser!.emailVerified = true
		setTimeout(() => {
			emit('update:modelValue', false)
		}, 1500)
	} catch (err: any) {
		errorMessage.value = err?.message || 'Verification failed'
	} finally {
		isLoading.value = false
	}
}

watch(() => props.modelValue, (newVal) => {
	if (!newVal && otpTimer) {
		clearInterval(otpTimer)
	}
	if (newVal) {
		step.value = 'email'
		email.value = ''
		otpCode.value = ''
		errorMessage.value = ''
	}
})

onUnmounted(() => {
	if (otpTimer) clearInterval(otpTimer)
})
</script>

<style scoped>
.pt-safe-top { padding-top: max(1.5rem, env(safe-area-inset-top)); }
.pb-safe-bottom { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.sheet-up-enter-active, .sheet-up-leave-active {
	transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.sheet-up-enter-from, .sheet-up-leave-to {
	transform: translateY(100%);
	opacity: 0;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

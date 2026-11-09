<template>
	<div class="w-full h-full flex flex-col bg-obsidian text-cream font-sans overflow-hidden">
		<div class="flex-1 min-h-0 overflow-y-auto px-6 pt-safe-top hide-scrollbar">
			<div class="pt-6 pb-4 space-y-2">
				<p class="text-[11px] font-mono uppercase tracking-[0.3em] text-gold">
					Privacy
				</p>
				<h1 class="text-2xl font-semibold text-cream leading-tight">
					Before we can check your look
				</h1>
				<p class="text-sm text-cream/60 leading-relaxed">
					A check sends the photo you take to OpenAI so it can write the
					feedback. We do not save the photo. You can withdraw this any time
					in Profile.
				</p>
			</div>

			<div class="space-y-3 pb-4">
				<div class="bg-ink border border-cream/10 rounded-2xl p-4 space-y-2">
					<p class="text-xs font-semibold text-cream">What happens to the photo</p>
					<ul class="text-[11px] text-cream/55 leading-relaxed space-y-1.5 list-disc pl-4">
						<li>It is held in memory on our server only for this request.</li>
						<li>It is sent to OpenAI in the United States for analysis.</li>
						<li>OpenAI does not use API content to train models, and may keep it for up to 30 days to monitor abuse.</li>
						<li>We do not store it in our database or file storage.</li>
					</ul>
				</div>

				<label class="flex items-start gap-3 bg-ink border border-cream/10 rounded-2xl p-4 cursor-pointer">
					<input v-model="ageConfirmed" type="checkbox" class="consent-check mt-0.5" />
					<span class="text-xs text-cream/80 leading-relaxed">
						I confirm I am 18 or older, and I will only submit a photo of myself
						or of an adult who has agreed.
					</span>
				</label>

				<label class="flex items-start gap-3 bg-ink border border-cream/10 rounded-2xl p-4 cursor-pointer">
					<input v-model="termsAccepted" type="checkbox" class="consent-check mt-0.5" />
					<span class="text-xs text-cream/80 leading-relaxed">
						I have read and agree to the
						<a
							href="https://sleekmirror.com/privacy"
							target="_blank"
							rel="noopener noreferrer"
							class="text-gold underline"
							@click.stop
						>Privacy Policy</a>
						and
						<a
							href="https://sleekmirror.com/terms"
							target="_blank"
							rel="noopener noreferrer"
							class="text-gold underline"
							@click.stop
						>Terms of Service</a>.
					</span>
				</label>

				<label class="flex items-start gap-3 bg-ink border border-cream/10 rounded-2xl p-4 cursor-pointer">
					<input v-model="aiPhotoProcessing" type="checkbox" class="consent-check mt-0.5" />
					<span class="text-xs text-cream/80 leading-relaxed">
						I consent to Sleekmirror sending my photo and the occasion I pick
						to OpenAI to produce the check. I understand this is optional, that
						the app cannot run a check without it, and that I can withdraw this
						consent in Profile.
					</span>
				</label>
			</div>
		</div>

		<div class="px-6 pt-3 pb-safe-bottom space-y-3 shrink-0 border-t border-cream/5">
			<Transition name="fade">
				<div
					v-if="errorMessage"
					class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 text-center"
				>
					{{ errorMessage }}
				</div>
			</Transition>

			<button
				type="button"
				:disabled="!canSubmit || isSaving"
				@click="accept"
				class="w-full py-4 px-4 rounded-xl bg-gold text-obsidian font-semibold text-sm transition-all active:scale-[0.98] hover:bg-gold-soft disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{{ isSaving ? 'Saving...' : 'I agree and continue' }}
			</button>

			<button
				type="button"
				:disabled="isSaving"
				@click="decline"
				class="w-full py-3 px-4 rounded-xl border border-cream/20 text-cream/70 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
			>
				Not now
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ declined: [] }>()

const userStore = useUserStore()

const ageConfirmed = ref(false)
const termsAccepted = ref(false)
const aiPhotoProcessing = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')

const canSubmit = computed(
	() => ageConfirmed.value && termsAccepted.value && aiPhotoProcessing.value
)

async function accept() {
	if (!canSubmit.value) return
	isSaving.value = true
	errorMessage.value = ''
	try {
		const response = await useApi<{ user: typeof userStore.currentUser }>(
			'/api/users/consent',
			{
				method: 'POST',
				body: {
					granted: true,
					ageConfirmed: true,
					termsAccepted: true,
					aiPhotoProcessing: true,
				},
			}
		)
		if (response.user) userStore.setUser(response.user)
	} catch (err: any) {
		errorMessage.value =
			err?.data?.statusMessage || err?.message || 'Could not save consent'
	} finally {
		isSaving.value = false
	}
}

function decline() {
	userStore.dismissConsentPrompt()
	emit('declined')
}
</script>

<style scoped>
.pt-safe-top { padding-top: max(1.5rem, env(safe-area-inset-top)); }
.pb-safe-bottom { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.consent-check {
	appearance: none;
	width: 1.1rem;
	height: 1.1rem;
	flex-shrink: 0;
	border-radius: 0.3rem;
	border: 1px solid rgb(245 241 232 / 0.25);
	background: transparent;
	cursor: pointer;
}
.consent-check:checked {
	background: #c9a96e;
	border-color: #c9a96e;
	background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.5 8.5L6.5 11.5L12.5 4.5' stroke='%230a0a0a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
	background-size: 0.85rem;
	background-repeat: no-repeat;
	background-position: center;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

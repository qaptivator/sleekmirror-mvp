<template>
	<Teleport to="body">
		<Transition name="sheet-up">
			<div
				v-if="modelValue"
				class="fixed inset-0 z-[55] flex flex-col justify-end bg-black/60"
				@click.self="close"
			>
				<div
					class="bg-obsidian text-cream font-sans rounded-t-3xl border-t border-cream/10 px-6 pt-4 pb-safe-bottom"
				>
					<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-cream/20" />

					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
								Daily scans
							</p>
							<h2 class="text-lg font-semibold text-cream mt-0.5">
								{{ userStore.hasScans ? 'Your scan balance' : 'No scans left' }}
							</h2>
						</div>
						<button
							type="button"
							@click="close"
							class="w-9 h-9 rounded-full flex items-center justify-center bg-cream/5 hover:bg-cream/10 transition-colors active:scale-95"
						>
							<IconX class="w-5 h-5 text-cream/70" />
						</button>
					</div>

					<div
						class="mt-5 rounded-2xl border p-4"
						:class="userStore.hasScans ? 'bg-ink border-cream/10' : 'bg-gold/5 border-gold/20'"
					>
						<div class="flex items-end justify-between gap-3">
							<div>
								<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
									Remaining
								</p>
								<p
									class="text-4xl font-bold font-mono tabular-nums leading-none mt-2"
									:class="userStore.hasScans ? 'text-gold' : 'text-cream/40'"
								>
									{{ userStore.credits }}
								</p>
							</div>
							<p class="text-xs text-muted text-right pb-1">
								of {{ userStore.dailyScanAllowance }} today
							</p>
						</div>

						<p
							v-if="!userStore.hasScans"
							class="mt-4 text-sm text-cream leading-relaxed"
						>
							You don't have any scans left. Come back tomorrow and we'll top you back up.
						</p>
						<p
							v-else
							class="mt-4 text-xs text-muted leading-relaxed"
						>
							Each check uses 1 scan. Unused scans do not carry over.
						</p>
					</div>

					<div class="mt-3 rounded-2xl bg-ink border border-cream/10 p-4 space-y-1.5">
						<p class="text-xs text-cream">Next refill</p>
						<p class="text-sm font-medium text-gold">
							{{ refillLabel }}
						</p>
						<p class="text-[11px] text-muted leading-relaxed">
							Your {{ userStore.dailyScanAllowance }} daily scans reset at
							{{ refillTime }}.
						</p>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const userStore = useUserStore()

function close() {
	emit('update:modelValue', false)
}

useBackHandler(() => props.modelValue, close)

const refillTime = computed(() => {
	const at = userStore.nextScanRenewalAt
	if (!at) return 'midnight'
	return new Date(at).toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit',
	})
})

const refillLabel = computed(() => {
	const at = userStore.nextScanRenewalAt
	if (!at) return 'Tomorrow'
	const reset = new Date(at)
	const now = new Date()
	const sameDay =
		reset.toDateString() === now.toDateString()
	const when = sameDay ? 'Today' : 'Tomorrow'
	return `${when} at ${refillTime.value}`
})
</script>

<style scoped>
.pb-safe-bottom {
	padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}

.sheet-up-enter-active,
.sheet-up-leave-active {
	transition: opacity 0.25s ease;
}
.sheet-up-enter-active > div,
.sheet-up-leave-active > div {
	transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-up-enter-from,
.sheet-up-leave-to {
	opacity: 0;
}
.sheet-up-enter-from > div,
.sheet-up-leave-to > div {
	transform: translateY(100%);
}
</style>

<template>
	<div
		class="w-full h-full flex flex-col bg-obsidian text-cream font-sans overflow-hidden"
	>
		<!-- Top Bar -->
		<div
			class="flex items-center justify-between px-5 pt-safe-top pb-2 shrink-0"
		>
			<p class="text-[11px] font-mono uppercase tracking-[0.3em] text-gold">
				Sleekmirror
			</p>
			<div class="flex items-center gap-2">
				<!-- Credits Badge -->
				<button
					type="button"
					@click="showScans = true"
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors active:scale-95"
					:class="
						userStore.hasScans
							? 'bg-gold/10 border-gold/20'
							: 'bg-cream/5 border-cream/15'
					"
				>
					<IconSparkles
						class="w-3 h-3"
						:class="userStore.hasScans ? 'text-gold' : 'text-cream/40'"
					/>
					<span
						class="text-[11px] font-mono font-bold tabular-nums"
						:class="userStore.hasScans ? 'text-gold' : 'text-cream/50'"
						>{{ userStore.credits }}</span
					>
					<span
						class="text-[10px] font-medium"
						:class="userStore.hasScans ? 'text-gold/80' : 'text-cream/40'"
						>scans</span
					>
				</button>
				<!-- Profile Button -->
				<button
					@click="showProfile = true"
					class="w-9 h-9 rounded-full flex items-center justify-center bg-cream/5 hover:bg-cream/10 transition-colors active:scale-95"
				>
					<IconCircleUser class="w-5 h-5 text-cream/70" />
				</button>
			</div>
		</div>

		<!-- Scrollable Content -->
		<div class="flex-1 overflow-y-auto px-5 pb-4 space-y-5 hide-scrollbar">
			<!-- Greeting -->
			<div class="pt-2">
				<p class="text-muted text-xs tracking-wide">{{ greeting }}</p>
				<h1 class="text-2xl font-semibold text-cream leading-tight mt-0.5">
					Ready to check<br />your look?
				</h1>
			</div>

			<!-- Out of scans banner -->
			<button
				v-if="!userStore.hasScans"
				type="button"
				@click="showScans = true"
				class="w-full bg-gold/5 border border-gold/20 rounded-2xl p-4 text-left"
			>
				<p class="text-[10px] uppercase tracking-widest text-gold font-bold">
					No scans left
				</p>
				<p class="text-sm text-cream mt-1">
					You don't have any scans. Come back tomorrow.
				</p>
				<p class="text-[11px] text-muted mt-1">Tap to see when they refill.</p>
			</button>

			<!-- Hero Snap Card -->
			<button
				@click="openSnap"
				class="w-full bg-ink border border-cream/10 rounded-2xl p-5 text-left group hover:border-gold/30 transition-all duration-300 active:scale-[0.99]"
			>
				<div class="flex items-center justify-between">
					<div class="space-y-1.5">
						<p
							class="text-[10px] uppercase tracking-widest text-gold font-bold"
						>
							Mirror Check
						</p>
						<p class="text-sm font-medium text-cream">
							{{ userStore.hasScans ? 'Snap your look now' : 'Scans refill tomorrow' }}
						</p>
						<p class="text-[11px] text-muted leading-snug max-w-[180px]">
							AI-powered analysis in seconds.
						</p>
					</div>
					<div
						class="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/15 transition-colors shrink-0"
					>
						<IconCamera class="w-8 h-8 text-gold" />
					</div>
				</div>
			</button>

			<!-- Recent Checks -->
			<div class="space-y-3">
				<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
					Recent Checks
				</p>

				<!-- Loading -->
				<div
					v-if="checkStore.listLoading && recentChecks.length === 0"
					class="flex justify-center py-8"
				>
					<div class="flex gap-1.5">
						<span
							v-for="i in 3"
							:key="i"
							class="w-2 h-2 rounded-full bg-gold/40 animate-bounce"
							:style="{ animationDelay: `${i * 0.2}s` }"
						/>
					</div>
				</div>

				<!-- Empty -->
				<div
					v-else-if="recentChecks.length === 0"
					class="border border-dashed border-cream/10 rounded-2xl p-8 text-center"
				>
					<IconCamera class="w-9 h-9 text-cream/15 mx-auto mb-3" />
					<p class="text-xs text-muted">No checks yet.</p>
					<p class="text-[11px] text-muted/60 mt-1">
						Hit the snap button below to get started.
					</p>
				</div>

				<!-- Recent Cards Grid -->
				<div
					v-else
					class="grid grid-cols-2 gap-3"
				>
					<CheckCard
						v-for="check in recentChecks"
						:key="check._id"
						:check="check"
						@open="selectedCheck = check"
					/>
				</div>

				<!-- View All -->
				<button
					v-if="recentChecks.length > 0"
					@click="showHistory = true"
					class="w-full py-3 rounded-xl border border-cream/10 text-xs text-muted hover:bg-cream/5 transition-colors"
				>
					View all history →
				</button>
			</div>

			<!-- Daily Tip -->
			<div class="bg-ink border border-cream/10 rounded-2xl p-4 space-y-2">
				<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
					Daily Tip
				</p>
				<p class="text-xs text-cream/60 leading-relaxed italic">
					"The best outfit is the one that fits you well and reflects how you
					feel today."
				</p>
			</div>

			<!-- Bottom padding so content isn't behind nav bar -->
			<div class="h-2" />
		</div>

		<!-- Bottom Navigation Bar -->
		<div class="shrink-0 border-t border-cream/5 bg-obsidian">
			<div class="flex items-center justify-around px-8 pt-3 pb-safe-bottom">
				<!-- Wardrobe is unfinished, so the button stays out of the bar.-->
				<button class="flex flex-col items-center gap-1">
					<div
						class="w-12 h-12 rounded-2xl flex items-center justify-center bg-cream/5 relative"
					>
						<IconShirt class="w-5 h-5 text-cream/35" />
					</div>
					<span class="text-[9px] text-muted/40 tracking-wide">Wardrobe</span>
				</button>

				<!--<div
					class="w-12"
					aria-hidden="true"
				/>-->

				<!-- Center Snap Button (raised) -->
				<button
					@click="openSnap"
					class="w-20 h-20 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 -mt-4"
					:class="
						userStore.hasScans
							? 'bg-gold shadow-gold/25'
							: 'bg-cream/20 shadow-none'
					"
				>
					<IconCamera
						class="w-9 h-9"
						:class="userStore.hasScans ? 'text-obsidian' : 'text-cream/50'"
					/>
				</button>

				<!-- History -->
				<button
					@click="showHistory = true"
					class="flex flex-col items-center gap-1 group"
				>
					<div
						class="w-12 h-12 rounded-2xl flex items-center justify-center bg-cream/5 group-active:scale-90 transition-transform"
					>
						<IconGalleryHorizontalEnd class="w-5 h-5 text-cream/60" />
					</div>
					<span class="text-[9px] text-muted tracking-wide">History</span>
				</button>
			</div>
		</div>

		<!-- ── Overlays ─────────────────────────────────────────── -->

		<!-- Snap / Camera page -->
		<SnapPage
			v-if="userStore.hasAiPhotoConsent"
			v-model="showSnap"
			@out-of-scans="showScans = true"
		/>

		<Teleport to="body">
			<Transition name="fade">
				<div
					v-if="showConsent"
					class="fixed inset-0 z-50"
				>
					<ConsentScreen @declined="showConsent = false" />
				</div>
			</Transition>
		</Teleport>

		<!-- History full-screen -->
		<Teleport to="body">
			<Transition name="fade">
				<div
					v-if="showHistory"
					class="fixed inset-0 z-50"
				>
					<ChecksView @close="showHistory = false" />
				</div>
			</Transition>

			<!-- Check result opened from home grid -->
			<Transition name="fade">
				<div
					v-if="selectedCheck"
					class="fixed inset-0 z-50"
				>
					<CheckView
						:check="selectedCheck"
						@close="selectedCheck = null"
					/>
				</div>
			</Transition>
		</Teleport>

		<!-- Profile drawer -->
		<ProfileDrawer
			v-model="showProfile"
			@open-scans="openScansFromProfile"
		/>
		<ScansSheet v-model="showScans" />
	</div>
</template>

<script setup lang="ts">
import type { Check } from '~/stores/useCheckStore'

const userStore = useUserStore()
const checkStore = useCheckStore()

const showSnap = ref(false)
const showConsent = ref(false)
const showHistory = ref(false)
const showProfile = ref(false)
const showScans = ref(false)
const selectedCheck = ref<Check | null>(null)

function openScansFromProfile() {
	showProfile.value = false
	showScans.value = true
}

function openSnap() {
	if (!userStore.hasScans) {
		showScans.value = true
		return
	}
	if (!userStore.hasAiPhotoConsent) {
		showConsent.value = true
		return
	}
	showSnap.value = true
}

const recentChecks = computed(() => checkStore.recentChecks)

const greeting = computed(() => {
	const h = new Date().getHours()
	if (h < 12) return 'Good morning,'
	if (h < 17) return 'Good afternoon,'
	if (h < 21) return 'Good evening,'
	return 'Good night,'
})

function refreshScanBalance() {
	if (!userStore.currentUser) return
	void userStore.refreshCredits().catch(() => {})
}

onMounted(() => {
	checkStore.loadChecks()
	refreshScanBalance()
	document.addEventListener('visibilitychange', onVisibility)
})

onUnmounted(() => {
	document.removeEventListener('visibilitychange', onVisibility)
})

function onVisibility() {
	if (!document.hidden) refreshScanBalance()
}

watch(showSnap, (open) => {
	if (!open) checkStore.loadChecks()
})

watch(
	() => userStore.hasAiPhotoConsent,
	(granted) => {
		if (granted && showConsent.value) {
			showConsent.value = false
			showSnap.value = true
		}
	}
)

</script>

<style scoped>
@reference "@/assets/css/main.css";

.pt-safe-top {
	padding-top: max(1.5rem, env(safe-area-inset-top));
}
.pb-safe-bottom {
	padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}

.hide-scrollbar::-webkit-scrollbar {
	display: none;
}
.hide-scrollbar {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>

<template>
	<div
		class="w-full h-full flex flex-col bg-obsidian text-cream font-sans overflow-hidden"
	>
		<!-- Top Bar -->
		<div
			class="flex items-center justify-between px-5 pt-safe-top pb-2 shrink-0"
		>
			<img
				src="@/assets/images/icon-bar.png"
				alt="Sleekmirror"
				class="h-6"
			/>
			<div class="flex items-center gap-2">
				<!-- Credits Badge -->
				<div
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20"
				>
					<IconSparkles class="w-3 h-3 text-gold" />
					<span class="text-[11px] font-mono font-bold text-gold">{{
						userStore.credits
					}}</span>
				</div>
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

			<!-- Hero Snap Card -->
			<button
				@click="showSnap = true"
				class="w-full bg-ink border border-cream/10 rounded-2xl p-5 text-left group hover:border-gold/30 transition-all duration-300 active:scale-[0.99]"
			>
				<div class="flex items-center justify-between">
					<div class="space-y-1.5">
						<p
							class="text-[10px] uppercase tracking-widest text-gold font-bold"
						>
							Mirror Check
						</p>
						<p class="text-sm font-medium text-cream">Snap your look now</p>
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
					v-if="checksLoading"
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
					<div
						v-for="check in recentChecks"
						:key="check._id"
						@click="selectedCheck = check"
						class="bg-ink border border-cream/10 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform cursor-pointer"
					>
						<!-- Thumbnail -->
						<div class="aspect-square bg-black/30 relative">
							<img
								v-if="thumbnails[check.file]"
								:src="thumbnails[check.file]"
								alt="thumbnail"
								class="w-full h-full object-cover"
							/>
							<div
								v-else
								class="w-full h-full flex items-center justify-center"
							>
								<IconCamera class="w-6 h-6 text-cream/20" />
							</div>
							<!-- Score Badge -->
							<div
								class="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-0.5"
							>
								<span
									class="text-sm font-bold font-mono tabular-nums"
									:style="getScoreColor(check.overallScore)"
									>{{ check.overallScore }}</span
								>
							</div>
						</div>
						<!-- Info -->
						<div class="p-2.5 space-y-1">
							<div class="flex items-center justify-between">
								<span
									class="text-[9px] uppercase tracking-wider text-gold font-semibold"
								>
									{{ check.contextTag }}
								</span>
								<span class="text-[9px] text-muted">{{
									formatDate(check.createdAt)
								}}</span>
							</div>
							<p class="text-[10px] text-cream/70 leading-snug line-clamp-2">
								{{ check.verdictHeadline }}
							</p>
						</div>
					</div>
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
				<!-- Wardrobe (WIP) -->
				<button
					@click="showWip = true"
					class="flex flex-col items-center gap-1 group"
				>
					<div
						class="w-12 h-12 rounded-2xl flex items-center justify-center bg-cream/5 group-active:scale-90 transition-transform relative"
					>
						<IconShirt class="w-5 h-5 text-cream/35" />
						<span
							class="absolute -top-1 -right-1 bg-muted/50 text-[7px] font-bold text-obsidian rounded px-1 py-0.5"
							>WIP</span
						>
					</div>
					<span class="text-[9px] text-muted/40 tracking-wide">Wardrobe</span>
				</button>

				<!-- Center Snap Button (raised) -->
				<button
					@click="showSnap = true"
					class="w-20 h-20 rounded-full bg-gold flex items-center justify-center shadow-xl shadow-gold/25 hover:scale-105 active:scale-95 transition-all duration-200 -mt-4"
				>
					<IconCamera class="w-9 h-9 text-obsidian" />
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
		<SnapPage v-model="showSnap" />

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
		<ProfileDrawer v-model="showProfile" />

		<!-- WIP Toast -->
		<Transition name="fade">
			<div
				v-if="showWip"
				class="fixed bottom-28 left-1/2 -translate-x-1/2 bg-ink border border-cream/20 rounded-xl px-5 py-3 text-xs text-muted z-50 shadow-xl whitespace-nowrap"
			>
				Wardrobe feature coming soon
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import type { Check } from '~/stores/useCheckStore'

const userStore = useUserStore()

const showSnap = ref(false)
const showHistory = ref(false)
const showProfile = ref(false)
const showWip = ref(false)
const selectedCheck = ref<Check | null>(null)

const recentChecks = ref<any[]>([])
const thumbnails = ref<Record<string, string>>({})
const checksLoading = ref(true)

const greeting = computed(() => {
	const h = new Date().getHours()
	if (h < 12) return 'Good morning,'
	if (h < 17) return 'Good afternoon,'
	if (h < 21) return 'Good evening,'
	return 'Good night,'
})

onMounted(async () => {
	try {
		const all = await useApi<any[]>('/api/checks')
		recentChecks.value = all.slice(0, 4)

		const uniqueFileIds = [...new Set(recentChecks.value.map((c) => c.file))]
		await Promise.all(
			uniqueFileIds.map(async (fileId) => {
				try {
					const blob = await useApi<Blob>(`/api/files/${fileId}/file`, {
						responseType: 'blob',
					})
					thumbnails.value[fileId as string] = URL.createObjectURL(blob)
				} catch {
					// show placeholder
				}
			})
		)
	} catch (err) {
		console.error('Failed to load recent checks:', err)
	} finally {
		checksLoading.value = false
	}
})

watch(showWip, (v) => {
	if (v) setTimeout(() => (showWip.value = false), 2500)
})

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	})
}

function getScoreColor(score: number): Record<string, string> {
	const pct = Math.min(Math.max(score, 0), 100)
	const h = 30 + pct * 0.15
	const s = 20 + pct * 0.65
	const l = 40 + pct * 0.15
	return { color: `hsl(${h.toFixed(0)}deg ${s.toFixed(0)}% ${l.toFixed(0)}%)` }
}
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

.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
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

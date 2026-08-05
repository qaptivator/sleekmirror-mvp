<template>
	<div
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center font-sans p-0 sm:p-4"
	>
		<!-- ========================================== -->
		<!-- DEBUG CONTROLS DRAWER                      -->
		<!-- ========================================== -->
		<!--<div
			class="absolute top-4 left-4 right-4 max-w-md mx-auto bg-ink/90 border border-cream/20 rounded-xl p-3 z-50 text-xs shadow-xl backdrop-blur-md"
		>
			<p class="font-bold text-gold uppercase tracking-wider mb-2 text-[10px]">
				🛠️ Schema Debug Panel
			</p>
			<div class="flex flex-wrap gap-2">
				<button
					@click="loadMockState('optimal')"
					class="px-2 py-1 rounded bg-cream/10 hover:bg-cream/20 text-cream"
				>
					State: High Scores
				</button>
				<button
					@click="loadMockState('critical')"
					class="px-2 py-1 rounded bg-cream/10 hover:bg-cream/20 text-cream"
				>
					State: Critical Fixes
				</button>
				<button
					@click="simulateIncomingPayload"
					class="px-2 py-1 rounded bg-gold/20 hover:bg-gold/30 text-gold font-medium"
				>
					⚡ Simulate Scan Sync
				</button>
			</div>
			<div class="mt-2 text-[10px] text-muted flex gap-3">
				<span
					>Context:
					<strong class="text-cream">{{
						activeCheck.contextTag
					}}</strong></span
				>
				<span
					>File ID:
					<strong class="text-cream"
						>{{ activeCheck.file.substring(0, 8) }}...</strong
					></span
				>
			</div>
		</div>-->

		<!-- ========================================== -->
		<!-- PRIMARY CHECK VIEW COMPONENT CONTAINER     -->
		<!-- ========================================== -->
		<div
			class="w-full max-w-xl bg-ink border-t sm:border border-cream/15 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden relative flex flex-col transition-all duration-500 ease-out"
			:style="{ maxHeight: '88vh' }"
		>
			<!-- Top Drag/Close Anchor Indicator -->
			<div
				class="flex justify-center py-3 shrink-0 cursor-pointer border-b border-cream/5 hover:bg-cream/5 transition-colors"
			>
				<div class="w-12 h-1 rounded-full bg-cream/20" />
			</div>

			<!-- Scrollable Content Core -->
			<div
				class="overflow-y-auto px-6 py-6 space-y-6 layout-content-scroll flex-1"
			>
				<!-- ZONE A: VERDICT HEADLINE & SCORE BLOCK -->
				<div
					class="flex items-center justify-between gap-4 bg-black/20 p-5 rounded-2xl border border-cream/5"
				>
					<div class="space-y-1 flex-1">
						<div
							class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cream/10 border border-cream/10 text-[10px] font-mono uppercase tracking-wider text-gold-soft"
						>
							FOR {{ activeCheck.contextTag }}
						</div>
						<h2 class="text-md font-semibold text-cream leading-snug">
							{{ activeCheck.verdictHeadline }}
						</h2>
					</div>

					<!-- Macro Gauge Area -->
					<div
						class="relative w-20 h-20 flex items-center justify-center shrink-0"
					>
						<!-- SVG Ring Track -->
						<svg
							class="w-full h-full transform -rotate-90"
							viewBox="0 0 36 36"
						>
							<path
								class="text-cream/10"
								stroke="currentColor"
								stroke-width="2.5"
								fill="none"
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
							/>
							<path
								class="transition-all duration-1000 ease-out"
								:style="getScoreStyle(activeCheck.overallScore, 'stroke')"
								stroke-width="2.5"
								stroke-dasharray="100, 100"
								:stroke-dashoffset="100 - activeCheck.overallScore"
								stroke-linecap="round"
								fill="none"
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
							/>
						</svg>
						<div class="absolute text-center">
							<span
								class="text-2xl font-light tracking-tighter text-cream tabular-nums font-mono"
							>
								{{ Math.round(activeCheck.overallScore) }}
							</span>
						</div>
					</div>
				</div>

				<!-- ZONE B: THE FIXED TRI-GRID CATEGORY MATRIX -->
				<div class="space-y-3">
					<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
						Category Feedback
					</p>

					<div class="grid grid-cols-1 gap-3">
						<!-- Dynamic Iteration via Computed Key Layout Struct -->
						<div
							v-for="(catData, catKey) in processedCategories"
							:key="catKey"
							class="border rounded-xl transition-all duration-300 overflow-hidden bg-black/10"
							:class="
								activeCategoryTab === catKey
									? 'border-gold/40 shadow-md shadow-gold/5 bg-ink'
									: 'border-cream/10 hover:border-cream/20'
							"
						>
							<!-- Header Row Toggle -->
							<div
								@click="toggleCategoryTab(catKey as string)"
								class="flex items-center justify-between p-4 cursor-pointer select-none active:bg-cream/5"
							>
								<div class="flex items-center gap-3">
									<!-- Status Mini Dot Indicator -->
									<!--<span
										class="w-2 h-2 rounded-full"
										:class="getScoreColorClass(catData.score, 'bg')"
									/>-->
									<div
										class="transition-opacity"
										:class="
											activeCategoryTab === catKey
												? 'opacity-100'
												: 'opacity-50'
										"
									>
										<IconShirt
											v-if="catKey === 'outfit'"
											:style="getScoreStyle(catData.score, 'text')"
										/>
										<!-- TODO: replace with a better general face icon -->
										<IconSmile
											v-if="catKey === 'grooming'"
											:style="getScoreStyle(catData.score, 'text')"
										/>
										<IconSparkles
											v-if="catKey === 'presentation'"
											:style="getScoreStyle(catData.score, 'text')"
										/>
									</div>
									<span class="text-sm font-medium text-cream capitalize">{{
										catKey
									}}</span>
								</div>
								<div class="flex items-center gap-3 font-mono">
									<span
										class="text-sm font-semibold tracking-wide tabular-nums"
										:style="getScoreStyle(catData.score, 'text')"
									>
										{{ catData.score }}/100
									</span>
									<!-- Toggle Chevron Icon -->
									<svg
										class="text-cream/40 transition-transform duration-300"
										:class="
											activeCategoryTab === catKey ? 'rotate-180 text-gold' : ''
										"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="6 9 12 15 18 9" />
									</svg>
								</div>
							</div>

							<!-- Expandable Feedback Panel -->
							<div
								v-show="activeCategoryTab === catKey"
								class="px-4 pb-4 pt-1 border-t border-cream/5 space-y-3 bg-black/10 transition-all text-xs"
							>
								<div class="space-y-1 pt-2">
									<!--<span
										class="text-[9px] uppercase tracking-wider text-muted font-semibold block"
										>Observation Summary</span
									>-->
									<p class="text-cream/80 leading-relaxed">
										{{ catData.feedback }}
									</p>
								</div>
								<div
									class="p-3 rounded-lg bg-gold/5 border border-gold/10 space-y-1"
								>
									<span
										class="text-[9px] uppercase tracking-wider text-gold font-bold block"
										>Fix</span
									>
									<p
										class="text-cream/90 leading-relaxed font-mono text-[11px]"
									>
										{{ catData.fix }}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- ZONE C: INTERACTIVE ACTION CHECKLIST ARRAY -->
				<div class="space-y-3">
					<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
						Priority Actions
					</p>

					<div
						v-if="activeCheck.actionChecklist.length === 0"
						class="text-center p-6 border border-dashed border-cream/10 rounded-xl"
					>
						<p class="text-xs text-muted">
							No explicit improvement tasks assigned to this check profile.
						</p>
					</div>

					<div
						v-else
						class="space-y-2"
					>
						<label
							v-for="(task, index) in activeCheck.actionChecklist"
							:key="index"
							class="flex items-start gap-3 p-3.5 rounded-xl border border-cream/5 bg-black/20 hover:bg-cream/5 cursor-pointer transition-colors group select-none"
						>
							<!-- Clean CSS Checkbox Box Element -->
							<div class="relative flex items-center mt-0.5 shrink-0">
								<input
									type="checkbox"
									v-model="checklistState[index as number]"
									class="peer sr-only"
								/>
								<div
									class="w-4 h-4 rounded border border-cream/30 bg-ink peer-checked:bg-gold peer-checked:border-gold transition-all flex items-center justify-center group-hover:border-cream/50"
								/>
								<svg
									class="absolute w-3 h-3 text-obsidian scale-0 peer-checked:scale-100 transition-transform left-0.5 top-0.5 pointer-events-none"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>

							<!-- Task Message Text -->
							<span
								class="text-xs transition-all duration-200"
								:class="
									checklistState[index as number]
										? 'line-through text-muted opacity-60'
										: 'text-cream/90'
								"
							>
								{{ task }}
							</span>
						</label>
					</div>
				</div>
			</div>

			<!-- Footer Action Router Block -->
			<div
				class="p-4 border-t border-cream/10 bg-ink/80 backdrop-blur-md flex gap-3 shrink-0"
			>
				<button
					@click="resetLocalCheckState"
					class="flex-1 bg-cream/10 border border-cream/10 text-cream/70 text-xs font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] hover:bg-cream/15 hover:text-cream cursor-pointer text-center flex items-center gap-2"
				>
					<IconShare2 class="w-5" />
					Share the results
				</button>
				<button
					@click="resetLocalCheckState"
					class="flex-1 bg-gold text-obsidian text-xs font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] hover:bg-gold-soft cursor-pointer shadow-md text-center flex items-center gap-2"
				>
					<IconMirrorRectangular class="w-5" />
					Do another snap
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{ check: any }>()
const emit = defineEmits(['close'])

const activeCheck = computed(() => props.check)
const activeCategoryTab = ref<string | null>('outfit')
const checklistState = ref<boolean[]>([])
const processedCategories = computed(() => activeCheck.value?.categories || {})

function initializeChecklistTracker() {
	checklistState.value = new Array(
		activeCheck.value?.actionChecklist?.length ?? 0
	).fill(false)
}
initializeChecklistTracker()

watch(
	() => activeCheck.value,
	() => initializeChecklistTracker(),
	{ deep: true }
)

function resetLocalCheckState() {
	emit('close')
}

function toggleCategoryTab(key: string) {
	activeCategoryTab.value = activeCategoryTab.value === key ? null : key
}

function getScoreStyle(
	score: number,
	mode: 'text' | 'bg' | 'stroke'
): Record<string, string> {
	const pct = Math.min(Math.max(score, 0), 100)
	const h = 30 + pct * 0.15
	const s = 20 + pct * 0.65
	const l = 40 + pct * 0.15
	const color = `hsl(${h.toFixed(0)}deg ${s.toFixed(0)}% ${l.toFixed(0)}%)`
	if (mode === 'text') return { color }
	if (mode === 'bg') {
		const alpha = pct < 40 ? '0.12' : (pct / 100).toFixed(2)
		return {
			backgroundColor: `hsl(${h.toFixed(0)}deg ${s.toFixed(0)}% ${l.toFixed(
				0
			)}% / ${alpha})`,
		}
	}
	return { stroke: color }
}
</script>

<style scoped>
.layout-content-scroll::-webkit-scrollbar {
	display: none;
}
.layout-content-scroll {
	-ms-overflow-style: none;
	scrollbar-width: none;
}
</style>

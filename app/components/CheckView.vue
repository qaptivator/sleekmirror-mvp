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
						activeCheck.context_tag
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
							#{{ activeCheck.context_tag }}
						</div>
						<h2 class="text-lg font-semibold text-cream leading-snug">
							{{ activeCheck.verdict_headline }}
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
								:class="getScoreColorClass(activeCheck.overall_score, 'stroke')"
								stroke-width="2.5"
								stroke-dasharray="100, 100"
								:stroke-dashoffset="100 - activeCheck.overall_score"
								stroke-linecap="round"
								fill="none"
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
							/>
						</svg>
						<div class="absolute text-center">
							<span
								class="text-2xl font-light tracking-tighter text-cream tabular-nums font-mono"
							>
								{{ Math.round(activeCheck.overall_score) }}
							</span>
						</div>
					</div>
				</div>

				<!-- ZONE B: THE FIXED TRI-GRID CATEGORY MATRIX -->
				<div class="space-y-3">
					<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
						Category Deep Dive
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
								@click="toggleCategoryTab(catKey)"
								class="flex items-center justify-between p-4 cursor-pointer select-none active:bg-cream/5"
							>
								<div class="flex items-center gap-3">
									<!-- Status Mini Dot Indicator -->
									<span
										class="w-2 h-2 rounded-full"
										:class="getScoreColorClass(catData.score, 'bg')"
									/>
									<span class="text-sm font-medium text-cream capitalize">{{
										catKey
									}}</span>
								</div>
								<div class="flex items-center gap-3 font-mono">
									<span
										class="text-sm font-semibold tracking-wide tabular-nums"
										:class="getScoreColorClass(catData.score, 'text')"
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
								<div class="space-y-1">
									<span
										class="text-[9px] uppercase tracking-wider text-muted font-semibold block"
										>Observation Summary</span
									>
									<p class="text-cream/80 leading-relaxed">
										{{ catData.feedback }}
									</p>
								</div>
								<div
									class="p-3 rounded-lg bg-gold/5 border border-gold/10 space-y-1"
								>
									<span
										class="text-[9px] uppercase tracking-wider text-gold font-bold block"
										>Required Fix Blueprint</span
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
						v-if="activeCheck.action_checklist.length === 0"
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
							v-for="(task, index) in activeCheck.action_checklist"
							:key="index"
							class="flex items-start gap-3 p-3.5 rounded-xl border border-cream/5 bg-black/20 hover:bg-cream/5 cursor-pointer transition-colors group select-none"
						>
							<!-- Clean CSS Checkbox Box Element -->
							<div class="relative flex items-center mt-0.5 shrink-0">
								<input
									type="checkbox"
									v-model="checklistState[index]"
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
									checklistState[index]
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
					class="flex-1 bg-gold text-obsidian text-xs font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] hover:bg-gold-soft cursor-pointer shadow-md text-center"
				>
					Initialize New Structural Scan
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ==========================================
// COMPONENT MOCK DATABASE SEED REGISTRY
// ==========================================
const mockDocuments = {
	optimal: {
		user: '64f1c11b9f1d2c001b8a3f11',
		file: '64f1c11b9f1d2c001b8a3f22',
		context_tag: 'interview_ready',
		overall_score: 91,
		verdict_headline:
			'Highly professional composition with optimized symmetry.',
		categories: {
			outfit: {
				score: 95,
				feedback:
					'Excellent contrast matching. Shoulder alignment vectors are crisp and color values show clean color cohesion.',
				fix: 'No optimization sequence needed for this category layer.',
			},
			grooming: {
				score: 88,
				feedback:
					'Clean facial geometry parameters. Hair boundaries present uniform tracking fields.',
				fix: 'Ensure edge resolution values remain consistent during movement tracking loops.',
			},
			presentation: {
				score: 90,
				feedback:
					'Posture lines run directly parallel with focal framing targets.',
				fix: 'Maintain current vertical angle metrics during target interactions.',
			},
		},
		action_checklist: [
			'Secure contrast uniformity across alternative scene transformations.',
			'Retain focal distance vectors across sequential iterations.',
		],
	},
	critical: {
		user: '64f1c11b9f1d2c001b8a3f11',
		file: '64f1c11b9f1d2c001b8a3f44',
		context_tag: 'casual_profile',
		overall_score: 48,
		verdict_headline:
			'Structural constraints compromised. Critical adjustments required.',
		categories: {
			outfit: {
				score: 42,
				feedback:
					'Severe silhouette pixel crushing. Low contrast boundaries break layout isolation parameters.',
				fix: 'Introduce higher variance midtone layers or high-contrast element filters.',
			},
			grooming: {
				score: 55,
				feedback:
					'Diffused light sources distort edge sharpness across upper bounding paths.',
				fix: 'Reposition localized key light vectors 45 degrees relative to primary tracking lens.',
			},
			presentation: {
				score: 47,
				feedback:
					'Asymmetrical alignment tracking detected. Tilt vectors deviate past baseline margins.',
				fix: 'Correct spine pitch rotation by negative 4.2 degrees to normalize geometric matrix fields.',
			},
		},
		action_checklist: [
			'Re-evaluate structural illumination sources before execution loop.',
			'Calibrate tracking framework parameters to fix drift anomalies.',
			'Purge background vector noise artifacts inside active canvas bounds.',
		],
	},
}

// Active Schema Target State Hook
const activeCheck = ref({ ...mockDocuments.optimal })

// Tracking Interactive Sub-Menu Dropdown State
const activeCategoryTab = ref<string | null>('outfit')

// Reactive Task Checkbox Registry Array
const checklistState = ref<boolean[]>([])

/**
 * Normalizes Schema Map to map safely across Template Iterators
 */
const processedCategories = computed(() => {
	return activeCheck.value.categories || {}
})

/**
 * Handles initialization matching tasks arrays smoothly on payload updates
 */
function initializeChecklistTracker() {
	if (activeCheck.value.action_checklist) {
		checklistState.value = new Array(
			activeCheck.value.action_checklist.length
		).fill(false)
	}
}
initializeChecklistTracker()

// Watch state data payloads to clear out previous task matrices safely
watch(
	() => activeCheck.value,
	() => {
		initializeChecklistTracker()
	},
	{ deep: true }
)

function toggleCategoryTab(key: string) {
	activeCategoryTab.value = activeCategoryTab.value === key ? null : key
}

/**
 * Direct Schema Data Override Utility Wrapper
 */
function loadMockState(tier: 'optimal' | 'critical') {
	activeCheck.value = { ...mockDocuments[tier] }
	activeCategoryTab.value = Object.keys(activeCheck.value.categories)[0] || null
}

/**
 * Emulates full data refresh cycles to test UI reactivity pipelines
 */
function simulateIncomingPayload() {
	activeCheck.value.overall_score = 12
	activeCheck.value.verdict_headline =
		'Processing incoming engine transformations...'

	setTimeout(() => {
		loadMockState(Math.random() > 0.5 ? 'optimal' : 'critical')
	}, 900)
}

function resetLocalCheckState() {
	console.log('Resetting component schema tracking loop.')
	loadMockState('optimal')
}

/**
 * Returns dynamic functional color allocations strictly by score index numbers
 */
function getScoreColorClass(
	score: number,
	mode: 'text' | 'bg' | 'stroke'
): string {
	if (score >= 80) {
		if (mode === 'text') return 'text-gold-soft'
		if (mode === 'bg') return 'bg-gold'
		return 'stroke-gold'
	} else if (score >= 60) {
		if (mode === 'text') return 'text-cream/80'
		if (mode === 'bg') return 'bg-cream/40'
		return 'stroke-cream/60'
	} else {
		if (mode === 'text') return 'text-rose-400'
		if (mode === 'bg') return 'bg-rose-500'
		return 'stroke-rose-500'
	}
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

<template>
	<div
		class="w-full h-full flex flex-col relative bg-obsidian text-cream font-sans"
	>
		<!-- HEADER WITH CONTEXT SELECTOR -->
		<div
			v-if="!capturedPhoto && !showResults"
			class="px-4 py-4 border-b border-cream/10 flex gap-2 justify-center bg-gradient-to-b from-ink to-obsidian/50 backdrop-blur-sm"
		>
			<button
				v-for="ctx in contexts"
				:key="ctx"
				@click="selectedContext = ctx"
				class="px-4 py-2 text-xs font-medium tracking-wide uppercase rounded-full transition-all duration-200"
				:class="
					selectedContext === ctx
						? 'bg-gold text-obsidian shadow-lg'
						: 'bg-cream/10 text-cream/60 hover:bg-cream/15 hover:text-cream/80'
				"
			>
				{{ ctx }}
			</button>
		</div>

		<!-- MAIN CAMERA AREA -->
		<div class="flex-1 relative bg-obsidian overflow-hidden">
			<div
				class="w-full h-full bg-gradient-to-br from-ink to-obsidian flex items-center justify-center transition-all duration-300"
				:class="capturedPhoto ? '' : 'border-b border-cream/10'"
			>
				<img
					v-if="capturedPhoto"
					:src="capturedPhoto"
					alt="captured image preview"
					class="w-full h-full object-cover"
				/>
				<div
					v-else
					class="text-center space-y-4"
				>
					<svg
						class="mx-auto text-cream/40"
						width="48"
						height="48"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"
						/>
						<circle
							cx="12"
							cy="13"
							r="3"
						/>
					</svg>
					<p class="text-cream/60 text-xs tracking-wide">Ready to analyze</p>
				</div>
			</div>

			<div
				v-if="!capturedPhoto"
				class="absolute inset-0 flex items-center justify-center pointer-events-none"
			>
				<div
					class="rounded-2xl border border-dashed border-gold/30 w-64 h-64 relative overflow-hidden"
				>
					<div
						v-for="i in 3"
						:key="i"
						class="absolute left-0 w-full h-px bg-gold/60 shadow-[0_0_8px_rgba(201,169,110,0.5)] animate-scan-beam"
						:style="{ animationDelay: `${(i - 1) * 0.8}s` }"
					/>
				</div>
			</div>

			<Transition name="fade">
				<div
					v-if="isScanning"
					class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10"
				>
					<div class="space-y-4 text-center">
						<div class="flex justify-center gap-1.5">
							<span
								v-for="i in 5"
								:key="i"
								class="w-2 h-2 rounded-full bg-gold animate-bounce"
								:style="{ animationDelay: `${i * 0.15}s` }"
							/>
						</div>
						<p
							class="text-gold-soft font-medium text-sm tracking-wide transition-all duration-300"
						>
							{{ scanningMessage }}
						</p>
					</div>
				</div>
			</Transition>
		</div>

		<!-- BOTTOM CONTROLS (UPLOAD & CAPTURE) -->
		<Transition name="fade">
			<div
				v-if="!capturedPhoto && !isScanning && !showResults"
				class="absolute bottom-0 left-0 right-0 px-6 py-8 flex flex-col items-center gap-4 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent"
			>
				<div class="flex items-center justify-center gap-10">
					<!-- Upload Button -->
					<button
						@click="triggerFileUpload"
						class="w-12 h-12 rounded-full flex items-center justify-center border border-cream/10 bg-ink/40 hover:bg-cream/10 transition-all duration-200 active:scale-95 cursor-pointer"
						title="Upload image file"
					>
						<svg
							class="text-cream/70"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line
								x1="12"
								y1="5"
								x2="12"
								y2="19"
							/>
							<line
								x1="5"
								y1="12"
								x2="19"
								y2="12"
							/>
						</svg>
					</button>

					<!-- Snap Button (Main) -->
					<button
						@click="handleCaptureSimulation"
						class="w-16 h-16 rounded-full bg-gold flex items-center justify-center shadow-lg hover:shadow-gold/20 hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer"
						title="Snap with demo image"
					>
						<svg
							class="text-obsidian"
							width="26"
							height="26"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"
							/>
							<circle
								cx="12"
								cy="13"
								r="3"
							/>
						</svg>
					</button>

					<!-- Flip Button -->
					<button
						@click="triggerFlipMock"
						class="w-12 h-12 rounded-full flex items-center justify-center border border-cream/10 bg-ink/40 hover:bg-cream/10 transition-all duration-200 active:scale-95 cursor-pointer"
						title="Flip camera (demo)"
					>
						<svg
							class="text-cream/70"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"
							/>
						</svg>
					</button>
				</div>
			</div>
		</Transition>

		<!-- Hidden file input -->
		<input
			ref="fileInput"
			type="file"
			accept="image/*"
			style="display: none"
			@change="handleFileUpload"
		/>

		<!-- CHECK RESULTS SHEET (from CheckView) -->
		<Teleport to="body">
			<Transition name="fade">
				<div
					v-if="showResults"
					class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
					@click="resetLayoutTray"
				/>
			</Transition>

			<Transition
				name="sheet-slide"
				@after-enter="triggerTweens"
			>
				<div
					v-if="showResults"
					class="fixed bottom-0 left-0 right-0 z-50 max-w-xl mx-auto rounded-t-3xl bg-ink border-t border-cream/15 glass shadow-2xl"
					:style="{ maxHeight: '85vh' }"
				>
					<div
						class="flex justify-center pt-4 pb-2 cursor-pointer"
						@click="resetLayoutTray"
					>
						<div
							class="w-12 h-1 rounded-full bg-cream/20 hover:bg-cream/40 transition-colors"
						/>
					</div>

					<div
						class="overflow-y-auto px-6 pb-10 pt-2 transition-all duration-500 ease-out layout-content-scroll"
						:class="
							renderContent
								? 'opacity-100 translate-y-0'
								: 'opacity-0 translate-y-4'
						"
						:style="{ maxHeight: 'calc(85vh - 3rem)' }"
					>
						<div class="space-y-6">
							<!-- VERDICT SECTION -->
							<div
								class="flex items-center justify-between gap-4 bg-black/20 p-5 rounded-2xl border border-cream/5"
							>
								<div class="space-y-1 flex-1">
									<div
										class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cream/10 border border-cream/10 text-[10px] font-mono uppercase tracking-wider text-gold-soft"
									>
										FOR {{ selectedContext.toUpperCase() }}
									</div>
									<h2 class="text-md font-semibold text-cream leading-snug">
										{{ checkResult.verdict_headline }}
									</h2>
								</div>

								<!-- Score Ring -->
								<div
									class="relative w-20 h-20 flex items-center justify-center shrink-0"
								>
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
											:style="getScoreStyle(checkResult.overall_score, 'stroke')"
											stroke-width="2.5"
											stroke-dasharray="100, 100"
											:stroke-dashoffset="100 - checkResult.overall_score"
											stroke-linecap="round"
											fill="none"
											d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
										/>
									</svg>
									<div class="absolute text-center">
										<span
											class="text-2xl font-light tracking-tighter text-cream tabular-nums font-mono"
										>
											{{ Math.round(checkResult.overall_score) }}
										</span>
									</div>
								</div>
							</div>

							<!-- CATEGORY BREAKDOWN -->
							<div class="space-y-3">
								<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
									Category Feedback
								</p>

								<div class="grid grid-cols-1 gap-3">
									<div
										v-for="(catData, catKey) in checkResult.categories"
										:key="catKey"
										class="border rounded-xl transition-all duration-300 overflow-hidden bg-black/10"
										:class="
											activeCategoryTab === catKey
												? 'border-gold/40 shadow-md shadow-gold/5 bg-ink'
												: 'border-cream/10 hover:border-cream/20'
										"
									>
										<div
											@click="toggleCategoryTab(catKey)"
											class="flex items-center justify-between p-4 cursor-pointer select-none active:bg-cream/5"
										>
											<div class="flex items-center gap-3">
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
													<IconSmile
														v-else-if="catKey === 'grooming'"
														:style="getScoreStyle(catData.score, 'text')"
													/>
													<IconSparkles
														v-else-if="catKey === 'presentation'"
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

										<div
											v-show="activeCategoryTab === catKey"
											class="px-4 pb-4 pt-1 border-t border-cream/5 space-y-3 bg-black/10 transition-all text-xs"
										>
											<div class="space-y-1 pt-2">
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

							<!-- ACTION CHECKLIST -->
							<div class="space-y-3">
								<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
									Priority Actions
								</p>

								<div
									v-if="checkResult.action_checklist.length === 0"
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
										v-for="(task, index) in checkResult.action_checklist"
										:key="index"
										class="flex items-start gap-3 p-3.5 rounded-xl border border-cream/5 bg-black/20 hover:bg-cream/5 cursor-pointer transition-colors group select-none"
									>
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
					</div>

					<!-- FOOTER BUTTONS -->
					<div
						class="p-4 border-t border-cream/10 bg-ink/80 backdrop-blur-md flex gap-3 shrink-0"
					>
						<button
							@click="resetLayoutTray"
							class="flex-1 bg-cream/10 border border-cream/10 text-cream/70 text-xs font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] hover:bg-cream/15 hover:text-cream cursor-pointer text-center"
						>
							Share Results
						</button>
						<button
							@click="resetLayoutTray"
							class="flex-1 bg-gold text-obsidian text-xs font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] hover:bg-gold-soft cursor-pointer shadow-md text-center"
						>
							Try Another
						</button>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// CONTEXT SELECTOR
const contexts = ['Interview', 'Casual', 'Formal']
const selectedContext = ref('Interview')

// UI STATE
const capturedPhoto = ref<string | null>(null)
const isScanning = ref(false)
const showResults = ref(false)
const renderContent = ref(false)
const renderBars = ref(false)
const scanningMessage = ref('Initializing analysis...')
const fileInput = ref<HTMLInputElement | null>(null)

// ANIMATION STATE
const tweenedOverallScore = ref(0)
const tweenedMetrics = reactive<number[]>([0, 0, 0, 0])
const checklistState = ref<boolean[]>([])
const activeCategoryTab = ref<string | null>('outfit')

// SCANNING MESSAGES
const scanningMessages = [
	'Querying engine pipelines...',
	'Isolating structural geometry...',
	'Evaluating lighting contrasts...',
	'Synthesizing structural context...',
]

// MOCK CHECK RESULT DATA
const checkResult = ref({
	overall_score: 84,
	verdict_headline: 'Highly professional composition with optimized symmetry.',
	categories: {
		outfit: {
			score: 85,
			feedback: 'Excellent contrast matching. Shoulder alignment is crisp.',
			fix: 'Consider darker accents to enhance silhouette contrast.',
		},
		grooming: {
			score: 78,
			feedback: 'Clean facial geometry. Hair boundaries are uniform.',
			fix: 'Ensure edge resolution remains consistent during movement.',
		},
		presentation: {
			score: 82,
			feedback: 'Posture lines run parallel with focal framing targets.',
			fix: 'Maintain current vertical angle metrics during interactions.',
		},
	},
	action_checklist: [
		'Secure contrast uniformity across alternative scene transformations.',
		'Retain focal distance vectors across sequential iterations.',
		'Refine background isolation parameters.',
	],
})

/**
 * Trigger file upload dialog
 */
function triggerFileUpload() {
	fileInput.value?.click()
}

/**
 * Handle selected file
 */
function handleFileUpload(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (file) {
		const reader = new FileReader()
		reader.onload = (e) => {
			capturedPhoto.value = e.target?.result as string
			startScanning()
		}
		reader.readAsDataURL(file)
	}
	// Reset input
	if (fileInput.value) {
		fileInput.value.value = ''
	}
}

/**
 * Handle demo image capture
 */
function handleCaptureSimulation() {
	capturedPhoto.value =
		'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000'
	startScanning()
}

/**
 * Start the scanning animation and show results
 */
function startScanning() {
	isScanning.value = true
	showResults.value = false
	renderContent.value = false
	renderBars.value = false
	tweenedOverallScore.value = 0
	checklistState.value = new Array(
		checkResult.value.action_checklist.length
	).fill(false)

	let currentStep = 0
	scanningMessage.value = scanningMessages[0]

	const segmentInterval = setInterval(() => {
		currentStep++
		if (currentStep < scanningMessages.length) {
			scanningMessage.value = scanningMessages[currentStep]
		} else {
			clearInterval(segmentInterval)
			isScanning.value = false
			showResults.value = true
		}
	}, 700)
}

/**
 * Animate numeric values
 */
function animateValue(
	start: number,
	end: number,
	duration: number,
	updateFn: (val: number) => void
) {
	const startTime = performance.now()
	function run(currentTime: number) {
		const elapsed = currentTime - startTime
		const progress = Math.min(elapsed / duration, 1)
		const ease = 1 - Math.pow(1 - progress, 3)
		updateFn(start + (end - start) * ease)
		if (progress < 1) {
			requestAnimationFrame(run)
		}
	}
	requestAnimationFrame(run)
}

/**
 * Trigger animations on results sheet entry
 */
function triggerTweens() {
	renderContent.value = true

	setTimeout(() => {
		renderBars.value = true

		animateValue(0, checkResult.value.overall_score, 1200, (v) => {
			tweenedOverallScore.value = v
		})

		Object.values(checkResult.value.categories).forEach((cat, index) => {
			animateValue(0, cat.score, 1400, (v) => {
				tweenedMetrics[index] = v
			})
		})
	}, 150)
}

/**
 * Toggle category panel
 */
function toggleCategoryTab(key: string) {
	activeCategoryTab.value = activeCategoryTab.value === key ? null : key
}

/**
 * Get color style for score
 */
function getScoreStyle(
	score: number,
	mode: 'text' | 'bg' | 'stroke'
): Record<string, string> {
	const pct = Math.min(Math.max(score, 0), 100)

	const h = 30 + pct * 0.15
	const s = 20 + pct * 0.65
	const l = 40 + pct * 0.15

	const color = `hsl(${h.toFixed(0)}deg ${s.toFixed(0)}% ${l.toFixed(0)}%)`

	if (mode === 'text') {
		return { color }
	}

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

/**
 * Reset to initial state
 */
function resetLayoutTray() {
	capturedPhoto.value = null
	isScanning.value = false
	showResults.value = false
	renderContent.value = false
	renderBars.value = false
	activeCategoryTab.value = 'outfit'
	checklistState.value = []
}

function triggerFlipMock() {
	console.log('Camera orientation toggled.')
}
</script>

<style scoped>
/* Keyframe Scanning Animations */
.animate-scan-beam {
	animation: visualScanBeam 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes visualScanBeam {
	0% {
		top: 0%;
		opacity: 0;
	}
	15% {
		opacity: 1;
	}
	85% {
		opacity: 1;
	}
	100% {
		top: 100%;
		opacity: 0;
	}
}

/* Base Translucent Layer Transitions */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.35s cubic-bezier(0.215, 0.61, 0.355, 1);
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

/* Elongated, Ultra-Smooth Bottom Sheet Transition Hook */
.sheet-slide-enter-active,
.sheet-slide-leave-active {
	transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-slide-enter-from,
.sheet-slide-leave-to {
	transform: translateY(100%);
}

.layout-content-scroll::-webkit-scrollbar {
	display: none;
}
.layout-content-scroll {
	-ms-overflow-style: none;
	scrollbar-width: none;
}
</style>

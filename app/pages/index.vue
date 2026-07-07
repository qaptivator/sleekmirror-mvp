<template>
	<div
		class="w-full h-full flex flex-col relative bg-obsidian text-cream font-sans"
	>
		<div class="flex-1 relative bg-obsidian overflow-hidden">
			<div
				class="w-full h-full bg-gradient-to-br from-ink to-obsidian flex items-center justify-center transition-all duration-300"
				:class="capturedPhoto ? '' : 'border-b border-cream/10'"
			>
				<img
					v-if="capturedPhoto"
					:src="capturedPhoto"
					alt="captured layout preview"
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
					<p class="text-cream/60 text-xs tracking-wide">Camera feed active</p>
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

		<Transition name="fade">
			<div
				v-if="!capturedPhoto && !isScanning && !showResults"
				class="absolute bottom-0 left-0 right-0 px-6 py-8 flex flex-col items-center gap-4 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent"
			>
				<div class="flex items-center justify-center gap-10">
					<button
						@click="triggerUploadMock"
						class="w-12 h-12 rounded-full flex items-center justify-center border border-cream/10 bg-ink/40 hover:bg-cream/10 transition-all duration-200 active:scale-95 cursor-pointer"
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

					<button
						@click="handleCaptureSimulation"
						class="w-16 h-16 rounded-full bg-gold flex items-center justify-center shadow-lg hover:shadow-gold/20 hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer"
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

					<button
						@click="triggerFlipMock"
						class="w-12 h-12 rounded-full flex items-center justify-center border border-cream/10 bg-ink/40 hover:bg-cream/10 transition-all duration-200 active:scale-95 cursor-pointer"
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
							<div class="flex items-start gap-4">
								<img
									v-if="capturedPhoto"
									:src="capturedPhoto"
									alt="analysis thumbnail preview"
									class="w-14 h-14 rounded-xl object-cover border border-cream/10"
								/>
								<div class="flex-1">
									<h2
										class="text-xl font-semibold text-cream serif tracking-wide"
									>
										Visual Profile Analysis
									</h2>
									<p
										class="text-xs text-gold/80 font-medium tracking-wider mt-0.5 uppercase"
									>
										Scan Metrics Finalized
									</p>
								</div>
							</div>

							<div class="h-px bg-cream/10" />

							<div
								class="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-cream/5"
							>
								<div>
									<p
										class="text-[10px] uppercase tracking-widest text-muted font-semibold"
									>
										Overall Index
									</p>
									<div class="flex items-baseline gap-1 mt-1">
										<span
											class="text-5xl font-light text-gold tracking-tighter serif tabular-nums"
										>
											{{ Math.floor(tweenedOverallScore) }}
										</span>
										<span class="text-xs text-cream/40">/100</span>
									</div>
								</div>
								<div>
									<p
										class="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2"
									>
										Vibe Composition
									</p>
									<div class="flex flex-wrap gap-1.5">
										<span
											v-for="(vibe, index) in vibes"
											:key="vibe"
											class="px-2.5 py-1 text-[11px] rounded-md bg-gold/10 border border-gold/20 text-gold-soft font-medium transition-all duration-500"
											:style="{
												transitionDelay: `${index * 100}s`,
												opacity: renderBars ? 1 : 0,
											}"
										>
											{{ vibe }}
										</span>
									</div>
								</div>
							</div>

							<div class="space-y-4">
								<p
									class="text-[10px] uppercase tracking-widest text-muted font-semibold"
								>
									Structural Breakdown
								</p>
								<div class="space-y-3.5">
									<div
										v-for="(metric, idx) in breakdown"
										:key="metric.label"
										class="space-y-1.5"
									>
										<div class="flex items-center justify-between text-xs">
											<span class="text-cream/90 font-medium">{{
												metric.label
											}}</span>
											<span
												class="text-gold font-semibold tracking-wide tabular-nums"
											>
												{{ tweenedMetrics[idx]?.toFixed(1) || '0.0' }}
											</span>
										</div>
										<div class="h-1.5 bg-cream/10 rounded-full overflow-hidden">
											<div
												class="h-full bg-gold rounded-full transition-all duration-1000 ease-out"
												:style="{ width: renderBars ? `${metric.pct}%` : '0%' }"
											/>
										</div>
									</div>
								</div>
							</div>

							<div class="h-px bg-cream/10" />

							<div class="space-y-2">
								<p
									class="text-[10px] uppercase tracking-widest text-muted font-semibold"
								>
									Identified Strengths
								</p>
								<ul class="space-y-2">
									<li
										v-for="(point, index) in whatsWorking"
										:key="point"
										class="flex items-start gap-2.5 text-sm text-cream/80 transition-all duration-500"
										:style="{
											transitionDelay: `${200 + index * 100}ms`,
											opacity: renderContent ? 1 : 0,
											transform: renderContent
												? 'translateX(0)'
												: 'translateX(-8px)',
										}"
									>
										<span class="text-gold text-xs mt-0.5">✓</span>
										<span>{{ point }}</span>
									</li>
								</ul>
							</div>

							<div
								class="p-4 rounded-xl bg-gold/5 border border-gold/15 space-y-1"
							>
								<p
									class="text-[10px] uppercase tracking-widest text-gold font-bold"
								>
									Primary Improvement Action
								</p>
								<p class="text-sm text-cream/90 leading-relaxed">
									{{ topUpgrade }}
								</p>
							</div>

							<div class="h-px bg-cream/10" />

							<div class="space-y-2.5">
								<button
									@click="resetLayoutTray"
									class="w-full bg-gold text-obsidian font-semibold py-3 px-4 rounded-xl text-sm transition-all active:scale-[0.98] hover:bg-gold-soft cursor-pointer shadow-md"
								>
									Retake Photo
								</button>
							</div>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// UI Layout Dynamic States
const capturedPhoto = ref<string | null>(null)
const isScanning = ref(false)
const showResults = ref(false)
const renderContent = ref(false)
const renderBars = ref(false)
const scanningMessage = ref('Initializing camera parameters...')

// Smooth Numeric Tweening Targets
const tweenedOverallScore = ref(0)
const tweenedMetrics = reactive<number[]>([0, 0, 0, 0])

const scanningMessages = [
	'Querying engine pipelines...',
	'Isolating structural geometry...',
	'Evaluating lighting contrasts...',
	'Synthesizing structural context...',
]

// Backend Matching Context Payload
const sleekScore = 84
const vibes = ref(['Structured', 'Sleek', 'Minimalist'])
const breakdown = ref([
	{ label: 'Outfit Coordination', score: 8.5, pct: 85 },
	{ label: 'Hair Architecture', score: 7.8, pct: 78 },
	{ label: 'Posture Vectors', score: 8.2, pct: 82 },
	{ label: 'Composition Profile', score: 9.0, pct: 90 },
])
const whatsWorking = ref([
	'High-contrast silhouette boundary alignment',
	'Minimalist background elements optimize presentation focal points',
	'Balanced tonal palette properties',
])
const topUpgrade = ref(
	'Introduce higher visual isolation parameters. Refining framing elements will optimize overall composition depth.'
)

/**
 * Handles linear numerical tween updates cleanly over a fixed duration windows.
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
		// Smooth easeOutCubic curve
		const ease = 1 - Math.pow(1 - progress, 3)
		updateFn(start + (end - start) * ease)
		if (progress < 1) {
			requestAnimationFrame(run)
		}
	}
	requestAnimationFrame(run)
}

/**
 * Triggers progressive entry behaviors once sheet-slide entry transition complete finishes execution.
 */
function triggerTweens() {
	renderContent.value = true

	// Tiny staggered delay before layout structural bars slide outward
	setTimeout(() => {
		renderBars.value = true

		// Tween overall scale score metric
		animateValue(0, sleekScore, 1200, (v) => {
			tweenedOverallScore.value = v
		})

		// Loop through metrics data mapping array indices cleanly
		breakdown.value.forEach((item, index) => {
			animateValue(0, item.score, 1400, (v) => {
				tweenedMetrics[index] = v
			})
		})
	}, 150)
}

/**
 * Executes visual pipeline timeline loop sequencing logic parameters.
 */
function handleCaptureSimulation() {
	capturedPhoto.value =
		'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000'
	isScanning.value = true
	showResults.value = false
	renderContent.value = false
	renderBars.value = false
	tweenedOverallScore.value = 0
	breakdown.value.forEach((_, i) => {
		tweenedMetrics[i] = 0
	})

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

function resetLayoutTray() {
	capturedPhoto.value = null
	isScanning.value = false
	showResults.value = false
	renderContent.value = false
	renderBars.value = false
}

function triggerUploadMock() {
	console.log('File picker pipeline initialized.')
}
function triggerFlipMock() {
	console.log('Camera hardware orientation toggled.')
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

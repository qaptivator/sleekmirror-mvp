<template>
	<div
		class="w-full h-full flex flex-col relative bg-obsidian text-cream font-sans"
	>
		<div class="p-4 bg-obsidian flex">
			<!--<button
				class="bg-transparent border-0 text-cream/70 text-xs font-semibold py-1.5 px-2 rounded-xl transition-all active:scale-[0.95] hover:bg-cream/10 hover:text-cream cursor-pointer text-center flex items-center gap-2"
			>
				<IconGalleryHorizontalEnd class="w-8" />
				History
			</button>-->
			<button
				class="bg-transparent border-0 text-cream/70 text-xs font-semibold py-1.5 px-2 rounded-xl transition-all active:scale-[0.95] hover:bg-cream/10 hover:text-cream cursor-pointer text-center flex items-center gap-2"
			>
				<IconZap class="w-8" />
			</button>
			<button
				@click="triggerFlipMock"
				class="bg-transparent border-0 text-cream/70 text-xs font-semibold py-1.5 px-2 rounded-xl transition-all active:scale-[0.95] hover:bg-cream/10 hover:text-cream cursor-pointer text-center flex items-center gap-2"
			>
				<IconRotateCw class="w-8" />
			</button>
			<div class="flex-1" />
			<button
				class="bg-transparent border-0 text-cream/70 text-xs font-semibold py-1.5 px-2 rounded-xl transition-all active:scale-[0.95] hover:bg-cream/10 hover:text-cream cursor-pointer text-center flex items-center gap-2"
			>
				<IconCircleUser class="w-8" />
			</button>
		</div>
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
						class="w-16 h-16 rounded-full flex items-center justify-center border border-cream/10 bg-ink/40 hover:bg-cream/10 transition-all duration-200 active:scale-95 cursor-pointer"
					>
						<IconImage class="text-cream/70" />
					</button>

					<!-- handleCaptureSimulation handleCapture -->
					<button
						@click="handleCapture"
						class="w-20 h-20 rounded-full bg-gold flex items-center justify-center shadow-lg hover:shadow-gold/20 hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer"
					>
						<IconCamera class="w-10 h-10 text-obsidian" />
					</button>

					<button
						class="w-16 h-16 rounded-full flex items-center justify-center border border-cream/10 bg-ink/40 hover:bg-cream/10 transition-all duration-200 active:scale-95 cursor-pointer"
					>
						<IconGalleryHorizontalEnd class="text-cream/70" />
					</button>
				</div>
			</div>
		</Transition>

		<Teleport to="body">
			<Transition name="fade">
				<div
					v-if="showResults && currentCheck"
					class="fixed inset-0 z-40"
				>
					<CheckView
						:check="currentCheck"
						@close="resetLayoutTray"
					/>
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
	scanningMessage.value = scanningMessages[0] ?? ''

	const segmentInterval = setInterval(() => {
		currentStep++
		if (currentStep < scanningMessages.length) {
			scanningMessage.value = scanningMessages[currentStep] ?? ''
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

const fileStore = useFileStore()
const checkStore = useCheckStore()
const currentCheck = ref<Check | null>(null)

async function handleCapture() {
	// Step 1: Get photo from camera
	// For now use file input on web, Capacitor later
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = 'image/*'

	input.onchange = async (e: any) => {
		const file = e.target.files[0]
		if (!file) return

		// Show the photo preview immediately
		capturedPhoto.value = URL.createObjectURL(file)

		// Show scanning state
		isScanning.value = true
		showResults.value = false
		let step = 0
		scanningMessage.value = scanningMessages[0] ?? ''

		const interval = setInterval(() => {
			step++
			if (step < scanningMessages.length) {
				scanningMessage.value = scanningMessages[step] ?? ''
			}
		}, 700)

		try {
			// Step 2: Upload file to server
			const uploaded = await fileStore.uploadFile(file)

			// Step 3: Run check against uploaded file
			const check = await checkStore.runCheck(
				uploaded.fileId, // note: server returns { fileId }
				'casual'
			)

			// Step 4: Show results
			clearInterval(interval)
			isScanning.value = false
			currentCheck.value = check
			showResults.value = true
		} catch (err) {
			clearInterval(interval)
			isScanning.value = false
			console.error('Check failed:', err)
		}
	}

	input.click()
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

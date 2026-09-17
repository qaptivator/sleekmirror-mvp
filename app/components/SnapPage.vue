<template>
	<Teleport to="body">
		<Transition name="snap-slide">
			<div
				v-if="modelValue"
				class="fixed inset-0 z-40 bg-black flex flex-col select-none"
			>
				<!-- Top Bar -->
				<div class="flex items-center justify-between px-5 pt-safe-top pb-3 z-10 shrink-0">
					<button
						@click="handleClose"
						class="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white active:scale-95 transition-transform"
					>
						<IconX class="w-5 h-5" />
					</button>
					<button
						@click="cameraStream.toggleFlash()"
						class="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 transition-all active:scale-95"
						:class="cameraStream.flashEnabled.value ? 'text-gold' : 'text-white/60'"
					>
						<IconZap class="w-5 h-5" />
					</button>
				</div>

				<!-- Camera Viewfinder -->
				<div class="flex-1 relative overflow-hidden">
					<!-- Video feed — hidden during scanning/preview so stream keeps running -->
					<video
						ref="videoRef"
						class="w-full h-full object-cover transition-opacity duration-300 absolute inset-0"
						:class="[
							(cameraStream.isReady.value && !capture.capturedPhoto.value) ? 'opacity-100' : 'opacity-0',
							cameraStream.isMirrored.value ? '-scale-x-100' : '',
						]"
						playsinline
						autoplay
						muted
					/>

					<!-- Camera loading indicator -->
					<div
						v-if="!cameraStream.isReady.value && !capture.capturedPhoto.value && !capture.isScanning.value"
						class="absolute inset-0 flex items-center justify-center bg-black"
					>
						<div class="text-center space-y-3">
							<div class="flex justify-center gap-1.5">
								<span
									v-for="i in 3"
									:key="i"
									class="w-2 h-2 rounded-full bg-gold/60 animate-bounce"
									:style="{ animationDelay: `${i * 0.2}s` }"
								/>
							</div>
							<p class="text-white/40 text-xs tracking-wide">Starting camera...</p>
						</div>
					</div>

					<!-- Captured photo preview (shown while scanning) -->
					<img
						v-if="capture.capturedPhoto.value"
						:src="capture.capturedPhoto.value"
						alt="captured preview"
						class="absolute inset-0 w-full h-full object-cover"
					/>

					<!-- Scan reticle (only when live, no photo yet) -->
					<div
						v-if="cameraStream.isReady.value && !capture.capturedPhoto.value"
						class="absolute inset-0 flex items-center justify-center pointer-events-none"
					>
						<div class="w-64 h-64 relative rounded-2xl border border-dashed border-gold/30 overflow-hidden">
							<div
								v-for="i in 3"
								:key="i"
								class="absolute left-0 w-full h-px bg-gold/60 shadow-[0_0_8px_rgba(201,169,110,0.5)] animate-scan-beam"
								:style="{ animationDelay: `${(i - 1) * 0.8}s` }"
							/>
						</div>
					</div>

					<!-- Scanning overlay -->
					<Transition name="fade">
						<div
							v-if="capture.isScanning.value"
							class="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-10"
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
								<p class="text-gold-soft font-medium text-sm tracking-wide">
									{{ capture.scanningMessage.value }}
								</p>
							</div>
						</div>
					</Transition>
				</div>

				<!-- Style Mode Carousel -->
				<div
					v-if="!capture.isScanning.value && !capture.capturedPhoto.value"
					class="shrink-0 py-4"
				>
					<div
						class="flex items-center gap-4 px-6 overflow-x-auto hide-scrollbar"
						style="scroll-snap-type: x mandatory;"
					>
						<button
							v-for="mode in modes"
							:key="mode.tag"
							@click="selectedMode = mode.tag"
							class="shrink-0 flex flex-col items-center gap-1 transition-all duration-200"
							style="scroll-snap-align: center;"
						>
							<span
								class="text-xs font-semibold tracking-wide transition-colors duration-200 whitespace-nowrap"
								:class="selectedMode === mode.tag ? 'text-gold' : 'text-white/40'"
							>
								{{ mode.label }}
							</span>
							<span
								class="w-1 h-1 rounded-full transition-all duration-200"
								:class="selectedMode === mode.tag ? 'bg-gold' : 'bg-transparent'"
							/>
						</button>
					</div>
				</div>

				<!-- Bottom Controls -->
				<div
					v-if="!capture.isScanning.value && !capture.capturedPhoto.value"
					class="shrink-0 flex items-center justify-center gap-10 px-6 pb-safe-bottom pt-2"
				>
					<!-- Gallery Picker -->
					<button
						@click="capture.triggerGalleryPicker(selectedMode)"
						class="w-14 h-14 rounded-full flex items-center justify-center border border-white/20 bg-black/40 hover:bg-white/10 transition-all active:scale-95"
					>
						<IconImage class="text-white/70 w-6 h-6" />
					</button>

					<!-- Shutter -->
					<button
						@click="handleSnap"
						class="w-20 h-20 rounded-full bg-gold flex items-center justify-center shadow-lg shadow-gold/20 hover:scale-105 transition-all duration-300 active:scale-95"
					>
						<IconCamera class="w-9 h-9 text-obsidian" />
					</button>

					<!-- Flip camera (right side — standard camera app convention) -->
					<button
						@click="handleFlip"
						class="w-14 h-14 rounded-full flex items-center justify-center border border-white/20 bg-black/40 hover:bg-white/10 transition-all active:scale-95"
					>
						<IconRefreshCw class="text-white/70 w-6 h-6" />
					</button>
				</div>

				<!-- Results sheet (teleported to body, above this page) -->
				<Teleport to="body">
					<Transition name="fade">
						<div
							v-if="capture.showResults.value && capture.currentCheck.value"
							class="fixed inset-0 z-[60]"
						>
							<CheckView
								:check="capture.currentCheck.value"
								@close="handleResultClose"
							/>
						</div>
					</Transition>
				</Teleport>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
	modelValue: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

const capture = useCapture()
const cameraStream = useCameraStream()
const videoRef = ref<HTMLVideoElement | null>(null)

const modes = [
	{ tag: 'casual', label: 'Casual' },
	{ tag: 'interview', label: 'Interview' },
	{ tag: 'date night', label: 'Date Night' },
	{ tag: 'formal', label: 'Formal' },
	{ tag: 'cocktail', label: 'Cocktail' },
]
const selectedMode = ref('casual')

async function startCamera() {
	await nextTick()
	if (videoRef.value) {
		await cameraStream.start(videoRef.value)
	}
}

function stopCamera() {
	cameraStream.stop(videoRef.value ?? undefined)
}

async function handleSnap() {
	if (!videoRef.value) return
	await capture.triggerCameraSnap(videoRef.value, selectedMode.value)
}

async function handleFlip() {
	await cameraStream.toggleFacingMode(videoRef.value)
}

function handleClose() {
	stopCamera()
	capture.reset()
	emit('update:modelValue', false)
}

function handleResultClose() {
	capture.reset()
	// Restart the camera feed after closing results
	nextTick(() => startCamera())
}

// Open/close lifecycle
watch(
	() => props.modelValue,
	async (isOpen) => {
		if (isOpen) {
			capture.reset()
			// Small delay so the transition can begin before camera starts
			await new Promise((r) => setTimeout(r, 80))
			await startCamera()
		} else {
			stopCamera()
		}
	}
)

// App visibility (backgrounding / switching apps)
let _pendingRestart = false
function handleVisibilityChange() {
	if (document.hidden) {
		_pendingRestart = cameraStream.isReady.value
		stopCamera()
	} else if (props.modelValue) {
		// Give the system a moment to release the camera before re-acquiring
		setTimeout(() => startCamera(), 300)
	}
}

onMounted(() => {
	document.addEventListener('visibilitychange', handleVisibilityChange)
	if (props.modelValue) startCamera()
})

onUnmounted(() => {
	document.removeEventListener('visibilitychange', handleVisibilityChange)
	stopCamera()
})
</script>

<style scoped>
.pt-safe-top {
	padding-top: max(1.5rem, env(safe-area-inset-top));
}
.pb-safe-bottom {
	padding-bottom: max(2.5rem, env(safe-area-inset-bottom));
}

.animate-scan-beam {
	animation: visualScanBeam 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes visualScanBeam {
	0%   { top: 0%;   opacity: 0; }
	15%  { opacity: 1; }
	85%  { opacity: 1; }
	100% { top: 100%; opacity: 0; }
}

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.snap-slide-enter-active,
.snap-slide-leave-active {
	transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.snap-slide-enter-from,
.snap-slide-leave-to {
	transform: translateY(100%);
	opacity: 0;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

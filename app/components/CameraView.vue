<template>
	<div class="flex-1 relative bg-obsidian overflow-hidden">
		<!-- Video feed or captured photo -->
		<div
			class="w-full h-full bg-gradient-to-br from-ink to-obsidian flex items-center justify-center transition-all duration-300"
			:class="capturedPhoto ? '' : 'border-b border-cream/10'"
		>
			<video
				v-if="!capturedPhoto && showLiveCamera"
				ref="videoElement"
				class="w-full h-full object-cover opacity-0 transition-opacity duration-300 [&:not([srcObject])]:hidden"
				:class="{ 'opacity-100': isVideoReady }"
				playsinline
				autoplay
				muted
				@loadedmetadata="isVideoReady = true"
			/>
			<img
				v-else-if="capturedPhoto"
				:src="capturedPhoto"
				alt="captured preview"
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
				<p class="text-cream/60 text-xs tracking-wide">Camera feed inactive</p>
			</div>
		</div>

		<!-- Scan frame overlay -->
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

		<!-- Scanning state overlay -->
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
</template>

<script setup lang="ts">
const props = defineProps<{
	capturedPhoto: string | null
	isScanning: boolean
	scanningMessage: string
	cameraPermissionGranted: boolean
}>()

const videoElement = ref<HTMLVideoElement | null>(null)
const showLiveCamera = ref(true)
const isVideoReady = ref(false)
let currentStream: MediaStream | null = null

function stopMediaTracks() {
	isVideoReady.value = false
	if (currentStream) {
		currentStream.getTracks().forEach((track) => track.stop())
		currentStream = null
	}
	if (videoElement.value) {
		videoElement.value.srcObject = null
	}
}

async function startCamera() {
	if (!props.cameraPermissionGranted || props.capturedPhoto) return

	stopMediaTracks()

	await nextTick() // Ensure <video> DOM ref is attached

	if (!videoElement.value) return

	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				facingMode: 'environment',
				width: { ideal: 1280 },
				height: { ideal: 720 },
			},
		})
		currentStream = stream
		if (videoElement.value) {
			videoElement.value.srcObject = stream
			showLiveCamera.value = true
		}
	} catch (err) {
		console.error('Failed to access camera:', err)
		showLiveCamera.value = false
	}
}

onMounted(() => {
	startCamera()
})

watch(
	() => props.cameraPermissionGranted,
	(granted) => {
		if (granted) {
			startCamera()
		} else {
			stopMediaTracks()
			showLiveCamera.value = false
		}
	}
)

watch(
	() => props.capturedPhoto,
	(newPhoto) => {
		if (newPhoto) {
			stopMediaTracks()
		} else {
			startCamera()
		}
	}
)

onBeforeUnmount(() => {
	stopMediaTracks()
})

defineExpose({
	videoElement,
	showLiveCamera,
	startCamera,
	stopMediaTracks,
})
</script>

<style scoped>
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
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.35s cubic-bezier(0.215, 0.61, 0.355, 1);
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>

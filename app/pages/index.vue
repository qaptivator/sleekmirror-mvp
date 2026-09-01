<template>
	<div
		class="w-full h-full flex flex-col relative bg-obsidian text-cream font-sans"
	>
		<!-- Top bar -->
		<div class="p-4 bg-obsidian flex items-center justify-between">
			<div class="flex items-center gap-2">
				<button
					@click="toggleFlash"
					class="icon-btn"
					:class="{ 'text-gold': flashEnabled }"
				>
					<IconZap class="w-8 h-8" />
				</button>
				<button
					@click="toggleOrientation"
					class="icon-btn"
				>
					<IconRotateCw class="w-8 h-8" />
				</button>
			</div>

			<button class="icon-btn">
				<IconCircleUser class="w-8 h-8" />
			</button>
		</div>

		<!-- Camera area -->
		<CameraView
			ref="cameraViewRef"
			:captured-photo="capture.capturedPhoto.value"
			:is-scanning="capture.isScanning.value"
			:scanning-message="capture.scanningMessage.value"
			:camera-permission-granted="cameraPermissionGranted"
		/>

		<!-- Bottom controls -->
		<CameraControls
			:visible="
				!capture.capturedPhoto.value &&
				!capture.isScanning.value &&
				!capture.showResults.value
			"
			@snap="handleSnapClick"
			@gallery="capture.triggerGalleryPicker"
			@history="showHistory = true"
		/>

		<!-- Results sheet -->
		<Teleport to="body">
			<Transition name="fade">
				<div
					v-if="capture.showResults.value && capture.currentCheck.value"
					class="fixed inset-0 z-40"
				>
					<CheckView
						:check="capture.currentCheck.value"
						@close="capture.reset"
					/>
				</div>
			</Transition>

			<Transition name="fade">
				<div
					v-if="showHistory"
					class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
					@click="showHistory = false"
				/>
			</Transition>

			<Transition name="sheet-slide">
				<div
					v-if="showHistory"
					class="fixed inset-0 z-50"
				>
					<ChecksView @close="showHistory = false" />
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
const capture = useCapture()
const permissions = useCameraPermissions()

const showHistory = ref(false)
const cameraViewRef = ref<{ videoElement?: HTMLVideoElement } | null>(null)
const flashEnabled = ref(false)
const facingMode = ref<'user' | 'environment'>('environment')
const cameraPermissionGranted = ref(false)

onMounted(async () => {
	const granted = await permissions.checkOrRequestCamera()
	cameraPermissionGranted.value = granted
})

async function handleSnapClick() {
	if (!cameraPermissionGranted.value) {
		const granted = await permissions.checkOrRequestCamera()
		if (!granted) return
		cameraPermissionGranted.value = true
	}

	const video = cameraViewRef.value?.videoElement
	if (video) {
		await capture.triggerCameraSnap(video)
	}
}

async function toggleFlash() {
	flashEnabled.value = !flashEnabled.value
	const videoTrack = getVideoTrack()

	if (videoTrack) {
		try {
			await (videoTrack as any).applyConstraints({
				advanced: [{ torch: flashEnabled.value }],
			})
		} catch (err) {
			console.error('Failed to toggle flash:', err)
		}
	}
}

async function toggleOrientation() {
	facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'

	const videoTrack = getVideoTrack()
	if (videoTrack) {
		videoTrack.stop()
	}

	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				facingMode: facingMode.value,
				width: { ideal: 1280 },
				height: { ideal: 720 },
			},
		})

		if (cameraViewRef.value?.videoElement) {
			cameraViewRef.value.videoElement.srcObject = stream
		}
	} catch (err) {
		console.error('Failed to switch camera:', err)
		facingMode.value =
			facingMode.value === 'environment' ? 'user' : 'environment'
	}
}

function getVideoTrack(): MediaStreamTrack | null {
	const stream = cameraViewRef.value?.videoElement
		?.srcObject as MediaStream | null
	return stream?.getVideoTracks()[0] || null
}
</script>

<style scoped>
@reference "@/assets/css/main.css";

.icon-btn {
	@apply bg-transparent border-0 text-cream/70 text-xs font-semibold py-1.5 px-2 rounded-xl transition-all active:scale-[0.95] hover:bg-cream/10 hover:text-cream cursor-pointer flex items-center gap-2;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.35s cubic-bezier(0.215, 0.61, 0.355, 1);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.sheet-slide-enter-active,
.sheet-slide-leave-active {
	transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-slide-enter-from,
.sheet-slide-leave-to {
	transform: translateY(100%);
}
</style>

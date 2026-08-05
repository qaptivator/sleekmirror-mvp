<template>
	<div
		class="w-full h-full flex flex-col relative bg-obsidian text-cream font-sans"
	>
		<!-- Top bar -->
		<div class="p-4 bg-obsidian flex">
			<button class="icon-btn">
				<IconZap class="w-8" />
			</button>
			<button
				@click="capture.reset"
				class="icon-btn"
			>
				<IconRotateCw class="w-8" />
			</button>
			<div class="flex-1" />
			<button class="icon-btn">
				<IconCircleUser class="w-8" />
			</button>
		</div>

		<!-- Camera area -->
		<CameraView
			:captured-photo="capture.capturedPhoto.value"
			:is-scanning="capture.isScanning.value"
			:scanning-message="capture.scanningMessage.value"
		/>

		<!-- Bottom controls -->
		<CameraControls
			:visible="
				!capture.capturedPhoto.value &&
				!capture.isScanning.value &&
				!capture.showResults.value
			"
			@snap="capture.triggerCameraSnap"
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
		</Teleport>
	</div>
</template>

<script setup lang="ts">
const capture = useCapture()
const showHistory = ref(false)
</script>

<style scoped>
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
</style>

<template>
	<Transition name="fade">
		<div
			v-if="visible"
			class="absolute bottom-0 left-0 right-0 px-6 py-8 flex flex-col items-center gap-4 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent"
		>
			<div class="flex items-center justify-center gap-10">
				<!-- Gallery picker -->
				<button
					@click="$emit('gallery')"
					class="w-16 h-16 rounded-full flex items-center justify-center border border-cream/10 bg-ink/40 hover:bg-cream/10 transition-all duration-200 active:scale-95 cursor-pointer"
				>
					<IconImage class="text-cream/70" />
				</button>

				<!-- Main snap button -->
				<button
					@click="$emit('snap')"
					class="w-20 h-20 rounded-full bg-gold flex items-center justify-center shadow-lg hover:shadow-gold/20 hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer"
				>
					<IconCamera class="w-10 h-10 text-obsidian" />
				</button>

				<!-- History -->
				<button
					@click="$emit('history')"
					class="w-16 h-16 rounded-full flex items-center justify-center border border-cream/10 bg-ink/40 hover:bg-cream/10 transition-all duration-200 active:scale-95 cursor-pointer"
				>
					<IconGalleryHorizontalEnd class="text-cream/70" />
				</button>
			</div>
		</div>
	</Transition>
</template>

<script setup lang="ts">
defineProps<{
	visible: boolean
}>()

defineEmits<{
	snap: []
	gallery: []
	history: []
}>()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.35s cubic-bezier(0.215, 0.61, 0.355, 1);
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>

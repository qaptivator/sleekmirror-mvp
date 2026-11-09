<template>
	<div class="w-full h-screen overflow-auto bg-obsidian text-cream font-sans">
		<!-- Header -->
		<div class="p-6 pb-2 flex justify-between">
			<div>
				<p class="text-[10px] uppercase tracking-widest text-muted font-bold">
					Past Checks
				</p>
				<h1 class="text-xl font-semibold text-cream mt-0.5">Your History</h1>
			</div>
			<button
				@click="emit('close')"
				class="icon-btn"
			>
				<IconX class="w-8" />
			</button>
		</div>

		<!-- Loading -->
		<div
			v-if="checkStore.listLoading && checks.length === 0"
			class="flex items-center justify-center h-48"
		>
			<div class="flex gap-1.5">
				<span
					v-for="i in 5"
					:key="i"
					class="w-2 h-2 rounded-full bg-gold animate-bounce"
					:style="{ animationDelay: `${i * 0.15}s` }"
				/>
			</div>
		</div>

		<!-- Error -->
		<div
			v-else-if="checkStore.listError && checks.length === 0"
			class="p-6"
		>
			<p class="text-xs text-red-400">Failed to load checks. {{ checkStore.listError }}</p>
		</div>

		<!-- Empty -->
		<div
			v-else-if="checks.length === 0"
			class="flex flex-col items-center justify-center h-48 gap-3"
		>
			<IconCamera class="text-cream/20 w-10 h-10" />
			<p class="text-xs text-muted">No checks yet. Take your first snap.</p>
		</div>

		<!-- Grid -->
		<div
			v-else
			class="grid grid-cols-2 gap-3 p-4"
		>
			<CheckCard
				v-for="check in checks"
				:key="check._id"
				:check="check"
				@open="selectedCheck = check"
			/>
		</div>

		<!-- CheckView modal for selected check -->
		<Teleport to="body">
			<Transition name="fade">
				<div
					v-if="selectedCheck"
					class="fixed inset-0 z-50"
				>
					<CheckView
						:check="selectedCheck"
						@close="selectedCheck = null"
					/>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const checkStore = useCheckStore()
const checks = computed(() => checkStore.checksList)
const selectedCheck = ref<any | null>(null)
const emit = defineEmits(['close'])

useBackHandler(
	() => true,
	() => emit('close')
)

onMounted(() => {
	checkStore.loadChecks()
})
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

</style>

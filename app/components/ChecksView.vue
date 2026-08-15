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
			v-if="loading"
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
			v-else-if="error"
			class="p-6"
		>
			<p class="text-xs text-red-400">Failed to load checks. {{ error }}</p>
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
			<div
				v-for="check in checks"
				:key="check._id"
				@click="selectedCheck = check"
				class="relative rounded-2xl overflow-hidden border border-cream/10 bg-ink cursor-pointer hover:border-gold/30 transition-all duration-200 active:scale-[0.98]"
			>
				<!-- Thumbnail -->
				<div class="aspect-square bg-black/40 relative">
					<img
						v-if="thumbnails[check.file]"
						:src="thumbnails[check.file]"
						class="w-full h-full object-cover"
						alt="check thumbnail"
					/>
					<div
						v-else
						class="w-full h-full flex items-center justify-center"
					>
						<IconCamera class="text-cream/20 w-8 h-8" />
					</div>

					<!-- Score badge -->
					<div
						class="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1"
					>
						<span
							class="text-sm font-bold font-mono tabular-nums"
							:style="getScoreStyle(check.overallScore)"
						>
							{{ check.overallScore }}
						</span>
					</div>
				</div>

				<!-- Info -->
				<div class="p-3 space-y-1">
					<div class="flex items-center justify-between">
						<span
							class="text-[9px] uppercase tracking-wider text-gold font-semibold"
						>
							{{ check.contextTag }}
						</span>
						<span class="text-[9px] text-muted">
							{{ formatDate(check.createdAt) }}
						</span>
					</div>
					<p class="text-[11px] text-cream/80 leading-snug line-clamp-2">
						{{ check.verdictHeadline }}
					</p>

					<!-- Category mini bars -->
					<div class="flex gap-1 pt-1">
						<div
							v-for="(cat, key) in check.categories"
							:key="key"
							class="flex-1 h-1 rounded-full bg-cream/10 overflow-hidden"
						>
							<div
								class="h-full rounded-full"
								:style="{
									width: `${cat.score}%`,
									backgroundColor: getScoreColor(cat.score),
								}"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- CheckView modal for selected check -->
		<Teleport to="body">
			<Transition name="fade">
				<div
					v-if="selectedCheck"
					class="fixed inset-0 z-40"
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
import { ref, onMounted } from 'vue'

const checks = ref<any[]>([])
const thumbnails = ref<Record<string, string>>({})
const loading = ref(true)
const error = ref<string | null>(null)
const selectedCheck = ref<any | null>(null)
const emit = defineEmits(['close'])

// Fetch all checks
onMounted(async () => {
	try {
		checks.value = await $fetch<any[]>('/api/checks')

		// Fetch thumbnails for each unique file
		const uniqueFileIds = [...new Set(checks.value.map((c) => c.file))]
		await Promise.all(
			uniqueFileIds.map(async (fileId) => {
				try {
					const blob = await $fetch<Blob>(`/api/files/${fileId}/file`, {
						responseType: 'blob',
					})
					thumbnails.value[fileId] = URL.createObjectURL(blob)
				} catch {
					// thumbnail failed, just show placeholder
				}
			})
		)
	} catch (err: any) {
		error.value = err?.message ?? 'Unknown error'
	} finally {
		loading.value = false
	}
})

function formatDate(dateStr: string): string {
	const date = new Date(dateStr)
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	})
}

function getScoreColor(score: number): string {
	const pct = Math.min(Math.max(score, 0), 100)
	const h = 30 + pct * 0.15
	const s = 20 + pct * 0.65
	const l = 40 + pct * 0.15
	return `hsl(${h.toFixed(0)}deg ${s.toFixed(0)}% ${l.toFixed(0)}%)`
}

function getScoreStyle(score: number): Record<string, string> {
	return { color: getScoreColor(score) }
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

.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>

<template>
	<button
		type="button"
		class="w-full text-left bg-ink border border-cream/10 rounded-2xl p-3.5 flex flex-col gap-2.5 min-h-[9.25rem] cursor-pointer hover:border-gold/30 transition-all duration-200 active:scale-[0.98]"
		@click="emit('open')"
	>
		<div class="flex items-start justify-between gap-3">
			<span class="text-[9px] uppercase tracking-wider text-gold font-semibold pt-1">
				{{ check.contextTag }}
			</span>
			<span
				v-if="check.photoUsable === false"
				class="text-sm font-bold font-mono uppercase tracking-wide text-cream/70"
			>
				N/A
			</span>
			<span
				v-else
				class="text-[1.65rem] font-bold font-mono tabular-nums leading-none"
				:style="{ color: scoreColor(check.overallScore) }"
			>
				{{ check.overallScore }}
			</span>
		</div>

		<p class="text-[12px] text-cream/85 leading-snug line-clamp-3 flex-1">
			{{
				check.photoUsable === false
					? check.photoIssue || "This photo can't be scored"
					: check.verdictHeadline
			}}
		</p>

		<div
			v-if="check.photoUsable !== false && check.categories"
			class="flex gap-1"
		>
			<div
				v-for="(cat, key) in check.categories"
				:key="key"
				class="flex-1 h-1 rounded-full bg-cream/10 overflow-hidden"
			>
				<div
					class="h-full rounded-full"
					:style="{
						width: `${cat.score}%`,
						backgroundColor: scoreColor(cat.score),
					}"
				/>
			</div>
		</div>

		<span class="text-[9px] text-muted">{{ formattedDate }}</span>
	</button>
</template>

<script setup lang="ts">
import type { Check } from '~/stores/useCheckStore'

const props = defineProps<{ check: Check }>()
const emit = defineEmits<{ open: [] }>()

const formattedDate = computed(() =>
	new Date(props.check.createdAt).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	})
)

function scoreColor(score: number): string {
	const pct = Math.min(Math.max(score, 0), 100)
	const h = 30 + pct * 0.15
	const s = 20 + pct * 0.65
	const l = 40 + pct * 0.15
	return `hsl(${h.toFixed(0)}deg ${s.toFixed(0)}% ${l.toFixed(0)}%)`
}
</script>

<style scoped>
.line-clamp-3 {
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>

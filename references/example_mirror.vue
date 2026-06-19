<template>
	<div class="w-full h-full flex flex-col relative">
		<!-- Camera Feed / Photo Display -->
		<div class="flex-1 relative bg-obsidian overflow-hidden">
			<!-- Placeholder for live camera or static photo -->
			<div
				class="w-full h-full bg-gradient-to-br from-ink to-obsidian flex items-center justify-center"
				:class="capturedPhoto ? '' : 'border-b border-cream/10'"
			>
				<NuxtImg
					v-if="capturedPhoto"
					:src="capturedPhoto"
					alt="captured"
					class="w-full h-full object-cover"
				/>
				<div
					v-else
					class="text-center space-y-4"
				>
					<IconCamera
						:size="48"
						class="mx-auto text-cream/40"
					/>
					<p class="text-cream/60 text-xs">Camera feed will appear here</p>
				</div>
			</div>

			<!-- Center highlight zone (when no photo) -->
			<div
				v-if="!capturedPhoto"
				class="absolute inset-0 flex items-center justify-center pointer-events-none"
			>
				<div
					class="rounded-2xl border border-dashed border-gold/50 w-1/2 h-1/2 relative overflow-hidden"
				>
					<div
						v-for="i in 3"
						:key="i"
						:class="[
							'absolute left-0 w-full h-px bg-gold animate-scan-beam',
							`delay-[${i * 0.8}s]`,
						]"
					/>
				</div>
			</div>

			<!-- Scanning animation (after capture) -->
			<Transition name="fade">
				<div
					v-if="isScanning"
					class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10"
				>
					<div class="space-y-4 text-center">
						<div class="flex justify-center gap-1">
							<span
								v-for="i in 10"
								:key="i"
								class="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"
							/>
						</div>
						<p class="text-cream text-sm">{{ scanningMessage }}</p>
					</div>
				</div>
			</Transition>
		</div>

		<!-- Controls (bottom overlay) -->
		<Transition name="fade">
			<div
				v-if="
					!capturedPhoto && !isScanning && !showIntentSelection && !showResults
				"
				class="absolute bottom-0 left-0 right-0 px-6 py-6 flex flex-col items-center gap-4 bg-gradient-to-t from-obsidian via-obsidian/50 to-transparent"
			>
				<!-- Action Buttons with Capture in Center -->
				<div class="flex items-center justify-center gap-8">
					<!-- Upload Button (Left) -->
					<button
						@click="uploadPhoto"
						class="w-12 h-12 rounded-full flex items-center justify-center hover:bg-cream/10 transition-all duration-200 active:scale-95"
					>
						<IconPlus
							:size="24"
							class="text-cream/60 hover:text-cream"
						/>
					</button>

					<!-- Capture Button -->
					<button
						@click="capturePhoto"
						class="w-16 h-16 rounded-full bg-gold flex items-center justify-center hover:shadow-lg hover:shadow-gold/30 transition-all duration-200 active:scale-95"
					>
						<IconCamera
							:size="28"
							class="text-obsidian"
						/>
					</button>

					<!-- Flip Button (Right) -->
					<button
						@click="flipCamera"
						class="w-12 h-12 rounded-full flex items-center justify-center hover:bg-cream/10 transition-all duration-200 active:scale-95"
					>
						<IconRotateCw
							:size="24"
							class="text-cream/60 hover:text-cream"
						/>
					</button>
				</div>
			</div>
		</Transition>

		<!-- Post-Capture Scanning UI -->
		<Transition name="slide-up">
			<div
				v-if="isScanning && capturedPhoto"
				class="absolute bottom-0 left-0 right-0 px-6 py-8"
			>
				<SleekButton
					variant="ghost"
					size="sm"
					@click="retakePhoto"
				>
					Retake
				</SleekButton>
			</div>
		</Transition>

		<!-- Results Display -->
		<SleekBottomSheet
			:is-open="showResults"
			:height="90"
			:close-on-backdrop-click="false"
		>
			<div class="space-y-6">
				<!-- Photo Thumbnail -->
				<div class="flex items-start gap-4">
					<NuxtImg
						v-if="capturedPhoto"
						:src="capturedPhoto"
						alt="result"
						class="w-12 h-12 rounded-lg object-cover"
					/>
					<div>
						<h2 class="text-lg font-semibold text-cream">
							{{ selectedIntent?.title }} Check
						</h2>
						<button class="text-xs text-gold hover:text-gold/80">Share</button>
					</div>
				</div>

				<div class="h-px bg-cream/10" />

				<!-- Sleek Score -->
				<div>
					<p class="text-xs uppercase text-muted mb-2">Sleek Score</p>
					<div class="text-5xl font-light text-gold">{{ sleekScore }}</div>
					<p class="text-sm text-cream/70 mt-1">/100</p>
				</div>

				<!-- Vibe Tags -->
				<div>
					<p class="text-xs uppercase text-muted mb-2">Vibe</p>
					<div class="flex flex-wrap gap-2">
						<span
							v-for="vibe in vibes"
							:key="vibe"
							class="px-3 py-1 text-xs rounded-full bg-gold/20 text-gold"
						>
							{{ vibe }}
						</span>
					</div>
				</div>

				<div class="h-px bg-cream/10" />

				<!-- Breakdown -->
				<div>
					<p class="text-xs uppercase text-muted mb-4">Breakdown</p>
					<div class="space-y-3">
						<div
							v-for="metric in breakdown"
							:key="metric.label"
						>
							<div class="flex items-center justify-between mb-1">
								<span class="text-sm text-cream">{{ metric.label }}</span>
								<span class="text-xs text-gold">{{ metric.score }}</span>
							</div>
							<div class="h-1.5 bg-cream/10 rounded-full overflow-hidden">
								<div
									class="h-full bg-gold rounded-full transition-all duration-1000"
									:style="{ width: showResults ? metric.pct + '%' : '0%' }"
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="h-px bg-cream/10" />

				<!-- What's Working -->
				<div>
					<p class="text-xs uppercase text-muted mb-2">What's Working</p>
					<ul class="space-y-1">
						<li
							v-for="point in whatsWorking"
							:key="point"
							class="text-sm text-cream/80"
						>
							✓ {{ point }}
						</li>
					</ul>
				</div>

				<!-- Top Upgrade -->
				<div>
					<p class="text-xs uppercase text-muted mb-2">Top Upgrade</p>
					<p class="text-sm text-cream/80">{{ topUpgrade }}</p>
				</div>

				<div class="h-px bg-cream/10" />

				<!-- Quick Fix Buttons -->
				<div class="space-y-2">
					<SleekButton
						fullWidth
						@click="goToStudio('make-attractive')"
					>
						Make it More Attractive
					</SleekButton>
					<SleekButton
						variant="secondary"
						fullWidth
						@click="goToStudio('fix-background')"
					>
						Fix the Background
					</SleekButton>
					<SleekButton
						variant="secondary"
						fullWidth
						@click="goToStudio('try-hair')"
					>
						Try Different Hair
					</SleekButton>
				</div>

				<div class="h-px bg-cream/10" />

				<!-- Want to Fix This? - Contextual Suggestions -->
				<div>
					<p class="text-xs uppercase text-muted mb-3">Want to fix this?</p>
					<div class="space-y-2">
						<!-- Hair Upgrade v-if="hairScore < 7" -->
						<SleekCard
							clickable
							@click="goToStudio('hair-upgrade')"
							class="group"
						>
							<div class="flex items-center justify-between">
								<div>
									<p
										class="font-medium text-cream group-hover:text-gold transition-colors"
									>
										Upgrade My Hair
									</p>
									<p class="text-xs text-cream/60 mt-0.5">
										Studio: Hair & Makeup
									</p>
								</div>
								<span class="text-gold">→</span>
							</div>
						</SleekCard>

						<!-- Outfit Upgrade v-if="outfitScore < 7" -->
						<SleekCard
							clickable
							@click="goToStudio('outfit-upgrade')"
							class="group"
						>
							<div class="flex items-center justify-between">
								<div>
									<p
										class="font-medium text-cream group-hover:text-gold transition-colors"
									>
										Plan a Better Outfit
									</p>
									<p class="text-xs text-cream/60 mt-0.5">Studio: Everyday</p>
								</div>
								<span class="text-gold">→</span>
							</div>
						</SleekCard>

						<!-- SOS Mode v-if="sleekScore < 70" -->
						<SleekCard
							clickable
							@click="goToStudio('sos')"
							class="group"
						>
							<div class="flex items-center justify-between">
								<div>
									<p
										class="font-medium text-cream group-hover:text-gold transition-colors"
									>
										SOS: Help Me Right Now
									</p>
									<p class="text-xs text-cream/60 mt-0.5">Studio: SOS</p>
								</div>
								<span class="text-gold">→</span>
							</div>
						</SleekCard>

						<!-- Save Look (if all scores high) -->
						<!--<SleekCard
							v-if="sleekScore > 80 && !shouldShowStudioSuggestions"
							clickable
							@click="saveCheck"
							class="group"
						>
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium text-cream group-hover:text-gold transition-colors">Save This Look</p>
									<p class="text-xs text-cream/60 mt-0.5">Add to Gallery</p>
								</div>
								<span class="text-gold">→</span>
							</div>
						</SleekCard>-->
					</div>
				</div>

				<div class="h-px bg-cream/10" />

				<!-- Footer Actions -->
				<button
					@click="retakeSeries"
					class="w-full py-2 text-sm text-cream/60 hover:text-cream transition-colors"
				>
					Take Another Photo
				</button>
			</div>
		</SleekBottomSheet>
	</div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const capturedPhoto = ref<string | null>(null)
const isScanning = ref(false)
const showIntentSelection = ref(false)
const showResults = ref(false)
const scanningMessage = ref('Scanning your look...')

const scanningMessages = [
	'Reading outfit...',
	'Analyzing hair...',
	'Checking vibe...',
	'Detecting pose...',
]

let scanIndex = 0

const intentOptions = [
	{ id: 'overall', title: 'Overall Glow-Up' },
	{ id: 'dating', title: 'Dating Profile' },
	{ id: 'date-night', title: 'Date Night' },
	{ id: 'social-media', title: 'Social Media Photo' },
	{ id: 'hair-makeup', title: 'Hair & Makeup' },
	{ id: 'work', title: 'Work / Interview' },
	{ id: 'outfit', title: 'Outfit Upgrade' },
	{ id: 'photo-ranking', title: 'Photo Ranking' },
]

const selectedIntent = ref(intentOptions[0])

// Mock data for results
const sleekScore = ref(78)
const vibes = ref(['Friendly', 'Relaxed', 'Natural'])
const breakdown = ref([
	{ label: 'Outfit', score: '8.0', pct: 80 },
	{ label: 'Hair', score: '7.0', pct: 70 },
	{ label: 'Grooming', score: '8.0', pct: 80 },
	{ label: 'Pose', score: '7.0', pct: 70 },
	{ label: 'Photo Quality', score: '6.5', pct: 65 },
])
const whatsWorking = ref([
	'Natural approachable vibe',
	'Good facial expression',
	"Outfit isn't distracting",
])
const topUpgrade = ref('Background is too busy. Sharper hair adds confidence.')

// Extract individual scores for contextual suggestions
const outfitScore = computed(() => parseFloat(breakdown.value[0]?.score || '0'))
const hairScore = computed(() => parseFloat(breakdown.value[1]?.score || '0'))
const groomingScore = computed(() =>
	parseFloat(breakdown.value[2]?.score || '0')
)
const poseScore = computed(() => parseFloat(breakdown.value[3]?.score || '0'))
const photoScore = computed(() => parseFloat(breakdown.value[4]?.score || '0'))

// Determine if we should show studio suggestions
const shouldShowStudioSuggestions = computed(() => {
	return hairScore.value < 7 || outfitScore.value < 7 || sleekScore.value < 70
})

onMounted(() => {
	const intentFromRoute = route.query.intent
	if (intentFromRoute) {
		const intent = intentOptions.find((i) => i.id === intentFromRoute)
		if (intent) selectedIntent.value = intent
	}
})

const capturePhoto = () => {
	// TODO: Integrate with camera/canvas API
	capturedPhoto.value = '/images/random_man2.png' // Placeholder
	isScanning.value = true
	scanIndex = 0

	const scanInterval = setInterval(() => {
		const scanning = scanningMessages[scanIndex % scanningMessages.length]
		if (scanning) {
			scanningMessage.value = scanning
			scanIndex++
		}
		if (scanIndex > 8) {
			clearInterval(scanInterval)
			isScanning.value = false
			showResults.value = true
		}
	}, 600)
}

const uploadPhoto = () => {
	// TODO: Implement file picker
}

const flipCamera = () => {
	// TODO: Implement camera flip
}

const retakePhoto = () => {
	capturedPhoto.value = null
	isScanning.value = false
	showIntentSelection.value = false
	showResults.value = false
}

const retakeSeries = () => {
	retakePhoto()
}

const goToStudio = (action: string) => {
	router.push({
		path: '/studio',
		query: { action, photo: capturedPhoto.value },
	})
}

const saveCheck = () => {
	// TODO: Save check to gallery
}
</script>

<style scoped>
.animate-scan-beam {
	animation: scanBeam 2.5s ease-in-out forwards;
}

@keyframes scanBeam {
	0% {
		top: 0%;
		opacity: 0;
	}
	10% {
		opacity: 1;
	}
	90% {
		opacity: 1;
	}
	100% {
		top: 100%;
		opacity: 0;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
	transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
	transform: translateY(100%);
}
</style>

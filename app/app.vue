<template>
	<div class="w-full h-full">
		<!-- Loading initial auth state -->
		<div v-if="isChecking" class="w-full h-full flex items-center justify-center bg-obsidian">
			<div class="flex flex-col items-center gap-4">
				<div class="inline-block w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
				<p class="text-xs text-cream/50 font-mono">Checking auth...</p>
			</div>
		</div>

		<!-- Not authenticated: show welcome screen -->
		<WelcomeScreen
			v-else-if="!isAuthenticated"
			@authenticated="onAuthenticatedSuccess"
		/>

		<!-- Authenticated: show main app -->
		<NuxtPage v-else />
	</div>
</template>

<script setup lang="ts">
const auth = useJwtAuth()

const isAuthenticated = computed(() => auth.isAuthenticated.value)
const isChecking = ref(true)

onMounted(async () => {
	// Try to restore authentication from previous session (refresh token)
	await auth.tryRestoreAuth()
	isChecking.value = false
})

async function onAuthenticatedSuccess() {
	// When user successfully logs in, the page will re-render
	// showing the main app
}
</script>

<style>
body {
	margin: 0;
	padding: 0;
}

#__nuxt {
	width: 100%;
	height: 100%;
}
</style>

<template>
	<div class="w-full h-full">
		<!-- Loading splash screen -->
		<div v-if="isChecking" class="w-full h-full flex items-center justify-center bg-obsidian">
			<img src="@/assets/icon-splash.png" alt="Sleekmirror" class="w-32 h-32" />
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

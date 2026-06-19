<template>
	<div class="h-screen w-screen overflow-hidden bg-obsidian text-cream">
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>
<script setup lang="ts">
useHead({
	title: 'Sleekmirror',
	meta: [
		{
			name: 'viewport',
			content: 'width=device-width, initial-scale=1, viewport-fit=cover',
		},
		{ name: 'theme-color', content: '#0a0a0a' },
	],
})
</script>

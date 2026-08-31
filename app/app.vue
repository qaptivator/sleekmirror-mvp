<template>
	<div class="h-screen w-screen overflow-hidden bg-obsidian text-cream">
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>
<script setup lang="ts">
const { initAuth } = useAuth()
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
import { StatusBar, Style } from '@capacitor/status-bar'

const lockStatusBarDark = async () => {
	// 1. Force the icons to stay white/light
	await StatusBar.setStyle({ style: Style.Dark })

	// 2. Force the background to stay pure black
	await StatusBar.setBackgroundColor({ color: '#000000' })
}
onMounted(async () => {
	lockStatusBarDark()
	console.log('app mounting')
	try {
		const data = await initAuth()
		console.log('auth finished for device:', data)
	} catch (err) {
		console.error('device auth failed:', err)
	}
})
</script>

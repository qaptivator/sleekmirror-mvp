import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: ['nuxt-lucide-icons', '@pinia/nuxt'],
	css: ['~/assets/css/main.css'],
	lucide: {
		namePrefix: 'Icon',
	},
	vite: {
		plugins: [tailwindcss()],
	},
	runtimeConfig: {
		// .env
		mongodbUri: '',
		openaiApiKey: '',
	},
})

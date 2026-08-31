import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: ['nuxt-lucide-icons', '@pinia/nuxt'],
	css: ['~/assets/css/main.css'],
	ssr: false,
	nitro: {
		// this makes the nuxt server not build on npx nuxt build
		//preset: 'static',
	},
	lucide: {
		namePrefix: 'Icon',
	},
	vite: {
		plugins: [tailwindcss()],
	},
	runtimeConfig: {
		public: {
			//apiBase: '',
			apiBase:
				process.env.NODE_ENV === 'production'
					? process.env.NUXT_PUBLIC_API_BASE
					: '',
		},
		// .env
		mongodbUri: '',
		openaiApiKey: '',
	},
})

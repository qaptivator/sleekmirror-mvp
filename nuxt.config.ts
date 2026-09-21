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
			// Development: empty string (requests go to same origin, Nitro backend)
			// Production: use the full API URL from environment variable
			apiBase:
				process.env.NODE_ENV === 'production'
					? process.env.UXT_PUBLIC_API_BASE ||
					  'https://sleekmirror-api.convenotes.com'
					: '', // dev: relative URLs (goes to localhost:3000 backend)
		},
		// .env
		mongodbUri: '',
		openaiApiKey: '',
		r2WorkerUrl:
			process.env.NUXT_R2_WORKER_URL || process.env.R2_WORKER_URL || '',
		r2WorkerSecret:
			process.env.NUXT_R2_WORKER_SECRET || process.env.R2_WORKER_SECRET || '',
		jwtSecret:
			process.env.NUXT_JWT_SECRET ||
			process.env.JWT_SECRET ||
			'dev-secret-change-in-production',
		jwtRefreshSecret:
			process.env.NUXT_JWT_REFRESH_SECRET ||
			process.env.JWT_REFRESH_SECRET ||
			'dev-refresh-secret-change-in-production',
	},
})

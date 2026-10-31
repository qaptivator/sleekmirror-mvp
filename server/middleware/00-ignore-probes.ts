// Bots request paths like /.env. Those are not pages, but Nuxt still renders
// them through Vue Router, which logs "No match found" for every hit.
// Answer 404 here so the router never sees them.
// `nuxt generate` (the Capacitor build) also prerenders /200.html and /404.html.
// Those must reach Nitro or the generate step exits on prerender errors.
const APP_PATHS = new Set(['/', '/robots.txt', '/200.html', '/404.html', '/index.html'])

export default defineEventHandler((event) => {
	if (import.meta.prerender) return

	const path = getRequestURL(event).pathname

	if (
		APP_PATHS.has(path) ||
		path.startsWith('/api/') ||
		// Nitro internals: /_nuxt assets and /_payload.json during prerender.
		path.startsWith('/_')
	) {
		return
	}

	setResponseStatus(event, 404)
	setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
	return 'Not found'
})
